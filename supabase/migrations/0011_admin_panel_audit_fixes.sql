-- ============================================================
-- HostelPups — Admin panel audit fixes (migration 0011)
-- ============================================================
-- Fixes from the 3-agent audit pass:
--
--  1. admin_user_summary.listing_count was wrong — `exists(select 1
--     from owners)` had no correlation to listings, so it returned
--     ALL listings or zero. Replace with owner_id correlation.
--
--  2. admin_actions.admin_id used ON DELETE RESTRICT, which made
--     admins un-deletable once they'd logged any action. Switch to
--     ON DELETE SET NULL so audit history survives + admins can be
--     removed. Make admin_id nullable to support that.
--
--  3. Add deleted_at column on listings for future soft-delete
--     (not enforced yet — preparation only).
--
-- ⚠️ Requires migrations 0009 + 0010 to be applied first
-- (depends on admin_user_summary and admin_actions tables).
-- Apply manually via Supabase SQL Editor.
-- Expand-only — safe to re-run.
-- ============================================================

-- --------------------------------------------------------------
-- 1. Fix listing_count in admin_user_summary
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
  (select count(*) from public.reports r
     where (r.target_type = 'user'  and r.target_id = p.id)
        or (r.target_type = 'owner' and r.target_id = p.id))                as reports_against,
  -- Correlate listings via owner_id (was: exists(select 1 from owners),
  -- which had no row-level correlation and returned global counts).
  (select count(*) from public.listings l where l.owner_id = p.id)          as listing_count
from public.profiles p;

grant select on public.admin_user_summary to authenticated;

-- --------------------------------------------------------------
-- 2. admin_actions.admin_id — switch to ON DELETE SET NULL
--    so historical audit rows survive when an admin account is
--    removed. Audit row's admin_id becomes null; UI renders as
--    "(removed admin)". Insert policy still enforces admin_id =
--    auth.uid() so live writes always have the current admin id.
-- --------------------------------------------------------------
alter table public.admin_actions
  drop constraint if exists admin_actions_admin_id_fkey;

alter table public.admin_actions
  alter column admin_id drop not null;

alter table public.admin_actions
  add constraint admin_actions_admin_id_fkey
  foreign key (admin_id) references public.profiles(id) on delete set null;

-- --------------------------------------------------------------
-- 3. Soft-delete prep for listings (column only, no behavior yet —
--    contract step happens in a later migration once the UI
--    knows about it).
-- --------------------------------------------------------------
alter table public.listings
  add column if not exists deleted_at timestamptz;

create index if not exists listings_deleted_at_idx
  on public.listings (deleted_at)
  where deleted_at is not null;

-- ============================================================
-- Verification
-- ============================================================
-- -- listing_count should now be correct per-user. For a sample user:
-- select id, email, listing_count from public.admin_user_summary limit 5;
--
-- -- admin_id should be nullable:
-- select is_nullable from information_schema.columns
--  where table_schema='public' and table_name='admin_actions'
--    and column_name='admin_id';                       -- expect 'YES'
--
-- -- ON DELETE SET NULL confirmed:
-- select confdeltype from pg_constraint
--  where conrelid='public.admin_actions'::regclass
--    and conname='admin_actions_admin_id_fkey';        -- expect 'n' (set null)
--
-- -- listings.deleted_at exists:
-- select column_name from information_schema.columns
--  where table_name='listings' and column_name='deleted_at';
