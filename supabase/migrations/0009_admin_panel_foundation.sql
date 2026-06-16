-- ============================================================
-- HostelPups — Admin panel foundation (migration 0009)
-- ============================================================
-- Adds everything `/admin/**` needs:
--
--   1. Ban columns on profiles (is_banned, banned_at, banned_reason, banned_by)
--   2. admin_actions audit log table (every admin mutation logs here)
--   3. is_admin() SQL helper (SECURITY DEFINER — safe to call inside RLS)
--   4. reports table (user-flagged content moderation queue)
--   5. Admin SELECT policies on supervisory tables (inquiries, messages,
--      calls, payments, reviews, owners) — admins see everything for triage
--   6. Admin UPDATE/DELETE policies on profiles/listings/owners/inquiries/
--      payments/messages/reviews — admins can edit/ban/refund/remove spam
--
-- Apply manually via Supabase SQL Editor (founder will do this).
-- Expand-only: no destructive changes. Safe to re-run.
-- ============================================================

-- --------------------------------------------------------------
-- 1. Ban columns on profiles
-- --------------------------------------------------------------
alter table public.profiles
  add column if not exists is_banned    boolean     not null default false,
  add column if not exists banned_at    timestamptz,
  add column if not exists banned_reason text,
  add column if not exists banned_by    uuid        references public.profiles(id) on delete set null;

create index if not exists profiles_is_banned_idx on public.profiles(is_banned) where is_banned;

-- --------------------------------------------------------------
-- 2. admin_actions audit log
-- --------------------------------------------------------------
create table if not exists public.admin_actions (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid not null references public.profiles(id) on delete restrict,
  action        text not null,                -- e.g. 'ban_user' | 'unban_user' | 'edit_profile' | 'approve_kyc' | 'suspend_listing' | 'refund_payment' | 'close_inquiry' | 'delete_message' | 'resolve_report'
  target_table  text,                          -- 'profiles' | 'listings' | 'owners' | 'inquiries' | 'payments' | 'messages' | 'reviews' | 'reports'
  target_id     uuid,
  before        jsonb,                         -- row state before (null for inserts)
  after         jsonb,                         -- row state after (null for deletes)
  reason        text,
  ip_address    text,                          -- audit hardening: record the admin's IP at the time
  created_at    timestamptz not null default now()
);

create index if not exists admin_actions_admin_idx  on public.admin_actions(admin_id, created_at desc);
create index if not exists admin_actions_target_idx on public.admin_actions(target_table, target_id, created_at desc);
create index if not exists admin_actions_action_idx on public.admin_actions(action, created_at desc);

-- --------------------------------------------------------------
-- 3. is_admin() helper (SECURITY DEFINER so RLS can call it
--    without recursive RLS lookup loops)
-- --------------------------------------------------------------
create or replace function public.is_admin(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = p_user and role = 'admin'
  );
$$;
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

-- --------------------------------------------------------------
-- 4. reports — user-flagged content moderation queue
-- --------------------------------------------------------------
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  target_type   text not null check (target_type in ('listing','user','message','review','owner','inquiry')),
  target_id     uuid not null,
  reason        text not null check (length(reason) between 3 and 200),
  details       text check (details is null or length(details) <= 2000),
  status        text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  resolved_by   uuid references public.profiles(id) on delete set null,
  resolved_at   timestamptz,
  resolution_note text,
  created_at    timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports(status, created_at desc);
create index if not exists reports_target_idx on public.reports(target_type, target_id);
create index if not exists reports_reporter_idx on public.reports(reporter_id);

-- --------------------------------------------------------------
-- 5. RLS — admin_actions + reports
-- --------------------------------------------------------------
alter table public.admin_actions enable row level security;

drop policy if exists "admin_actions_select_admin" on public.admin_actions;
create policy "admin_actions_select_admin" on public.admin_actions for select
  using (public.is_admin());

drop policy if exists "admin_actions_insert_admin" on public.admin_actions;
create policy "admin_actions_insert_admin" on public.admin_actions for insert
  with check (public.is_admin() and admin_id = auth.uid());

-- No UPDATE/DELETE policies on admin_actions — audit log is immutable.

alter table public.reports enable row level security;

drop policy if exists "reports_insert_self" on public.reports;
create policy "reports_insert_self" on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin" on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports for update
  using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------
-- 6. Admin SELECT policies on supervisory tables
--    (these run alongside existing participant-scoped policies —
--     PostgreSQL OR's matching policies together)
-- --------------------------------------------------------------
drop policy if exists "inquiries_select_admin" on public.inquiries;
create policy "inquiries_select_admin" on public.inquiries for select
  using (public.is_admin());

drop policy if exists "messages_select_admin" on public.messages;
create policy "messages_select_admin" on public.messages for select
  using (public.is_admin());

drop policy if exists "calls_select_admin" on public.calls;
create policy "calls_select_admin" on public.calls for select
  using (public.is_admin());

drop policy if exists "payments_select_admin" on public.payments;
create policy "payments_select_admin" on public.payments for select
  using (public.is_admin());

drop policy if exists "reviews_select_admin" on public.reviews;
create policy "reviews_select_admin" on public.reviews for select
  using (public.is_admin());

drop policy if exists "owners_select_admin" on public.owners;
create policy "owners_select_admin" on public.owners for select
  using (public.is_admin());

drop policy if exists "user_access_select_admin" on public.user_access;
create policy "user_access_select_admin" on public.user_access for select
  using (public.is_admin());

drop policy if exists "favorites_select_admin" on public.favorites;
create policy "favorites_select_admin" on public.favorites for select
  using (public.is_admin());

drop policy if exists "room_types_select_admin" on public.room_types;
create policy "room_types_select_admin" on public.room_types for select
  using (public.is_admin());

drop policy if exists "listing_photos_select_admin" on public.listing_photos;
create policy "listing_photos_select_admin" on public.listing_photos for select
  using (public.is_admin());

-- --------------------------------------------------------------
-- 7. Admin UPDATE policies — edit, ban, KYC, refund, close
-- --------------------------------------------------------------
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "listings_update_admin" on public.listings;
create policy "listings_update_admin" on public.listings for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "owners_update_admin" on public.owners;
create policy "owners_update_admin" on public.owners for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "inquiries_update_admin" on public.inquiries;
create policy "inquiries_update_admin" on public.inquiries for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payments_update_admin" on public.payments;
create policy "payments_update_admin" on public.payments for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "user_access_update_admin" on public.user_access;
create policy "user_access_update_admin" on public.user_access for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "room_types_update_admin" on public.room_types;
create policy "room_types_update_admin" on public.room_types for update
  using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------
-- 8. Admin DELETE policies — spam removal, takedowns
-- --------------------------------------------------------------
drop policy if exists "messages_delete_admin" on public.messages;
create policy "messages_delete_admin" on public.messages for delete
  using (public.is_admin());

drop policy if exists "reviews_delete_admin" on public.reviews;
create policy "reviews_delete_admin" on public.reviews for delete
  using (public.is_admin());

drop policy if exists "listings_delete_admin" on public.listings;
create policy "listings_delete_admin" on public.listings for delete
  using (public.is_admin());

drop policy if exists "listing_photos_delete_admin" on public.listing_photos;
create policy "listing_photos_delete_admin" on public.listing_photos for delete
  using (public.is_admin());

drop policy if exists "room_types_delete_admin" on public.room_types;
create policy "room_types_delete_admin" on public.room_types for delete
  using (public.is_admin());

-- --------------------------------------------------------------
-- 9. Helper view: user_summary (one-row-per-user with activity counts)
--    Saves the user CRM page a half-dozen subqueries per row.
-- --------------------------------------------------------------
create or replace view public.admin_user_summary
  with (security_invoker = on) as
select
  p.id,
  p.email,
  p.phone,
  p.name,
  p.role,
  p.is_banned,
  p.banned_at,
  p.banned_reason,
  p.created_at,
  (select count(*) from public.inquiries i where i.user_id = p.id)         as inquiry_count,
  (select count(*) from public.calls c where c.caller_id = p.id
                                          or c.callee_id = p.id)            as call_count,
  (select count(*) from public.favorites f where f.user_id = p.id)          as favorite_count,
  (select count(*) from public.reports r where r.reporter_id = p.id)        as reports_filed,
  (select count(*) from public.reports r where r.target_type = 'user'
                                            and r.target_id = p.id)         as reports_against,
  (select count(*) from public.listings l
     where exists (select 1 from public.owners o where o.id = p.id))        as listing_count
from public.profiles p;

grant select on public.admin_user_summary to authenticated;

-- --------------------------------------------------------------
-- 10. First-admin bootstrap (manual step — uncomment + edit then run)
-- --------------------------------------------------------------
-- update public.profiles
--    set role = 'admin'
--  where email = 'YOUR_FOUNDER_EMAIL@example.com';

-- ============================================================
-- Verification
-- ============================================================
-- -- Should return true (after you bootstrap yourself as admin):
-- select public.is_admin();
--
-- -- Should show is_banned, banned_at, banned_reason, banned_by:
-- select column_name from information_schema.columns
--  where table_name = 'profiles'
--    and column_name in ('is_banned','banned_at','banned_reason','banned_by');
--
-- -- Should list admin_actions + reports:
-- select tablename from pg_tables
--  where schemaname = 'public'
--    and tablename in ('admin_actions','reports');
--
-- -- Should return at least 25 admin policies across tables:
-- select count(*) from pg_policy
--  where polname like '%_admin%' or polname like 'admin_actions%';
