-- ============================================================
-- HostelPups — Calls schema (Phase 2 preparation)
-- ============================================================
-- Adds: public.calls (in-app WebRTC voice calls between renters and owners).
--
-- Phone numbers are NEVER exposed in either direction. All calls happen
-- through WebRTC inside HostelPups, scoped to an existing inquiry — the
-- same way messages are scoped today.
--
-- Apply order: 0001_initial_schema → 0002_rls_policies → 0003_storage_setup → 0004_calls_schema → seed.sql
--
-- Schema follows expand-contract migration pattern: this is a pure
-- expand release. No drops, no destructive changes, no rename-in-place.
-- ============================================================

-- ------------------------------------------------------------
-- 1. calls — one row per call attempt (ringing through ended/missed)
-- ------------------------------------------------------------
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  caller_id uuid not null references auth.users(id) on delete cascade,
  callee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'ringing'
    check (status in ('ringing','accepted','rejected','missed','ended','failed','cancelled')),
  started_at timestamptz not null default now(),
  accepted_at timestamptz,
  ended_at timestamptz,
  duration_seconds int not null default 0 check (duration_seconds >= 0),
  end_reason text
    check (end_reason in ('hangup_caller','hangup_callee','rejected','no_answer','network_error','user_cancelled')),
  recording_url text,
  caller_muted boolean not null default false,
  callee_muted boolean not null default false,
  was_speaker boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.calls is
  'In-app WebRTC calls between user (renter) and owner (business). Phone numbers never exposed.';

-- Indexes for the common query shapes:
--   - "list my recent calls"          → caller_id / callee_id + started_at desc
--   - "show calls on this inquiry"   → inquiry_id
--   - "active / ringing call lookup" → status (sparse, but cheap)
create index if not exists calls_inquiry_id_idx   on public.calls (inquiry_id);
create index if not exists calls_caller_id_idx    on public.calls (caller_id);
create index if not exists calls_callee_id_idx    on public.calls (callee_id);
create index if not exists calls_status_idx       on public.calls (status);
create index if not exists calls_started_at_idx   on public.calls (started_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.calls enable row level security;

-- SELECT: only caller or callee can read a call record.
drop policy if exists "calls_select_participants" on public.calls;
create policy "calls_select_participants"
  on public.calls for select
  using (
    caller_id = auth.uid()
    or callee_id = auth.uid()
  );

-- INSERT: only the caller themselves can create a call.
-- The inquiry must exist and the caller must be a participant of it
-- (either the inquiry author or the listing owner).
drop policy if exists "calls_insert_self_caller" on public.calls;
create policy "calls_insert_self_caller"
  on public.calls for insert
  with check (
    caller_id = auth.uid()
    and exists (
      select 1 from public.inquiries i
      left join public.listings l on l.id = i.listing_id
      where i.id = calls.inquiry_id
        and (
          i.user_id = auth.uid()
          or l.owner_id = auth.uid()
        )
    )
  );

-- UPDATE: either participant can update the row. Per task spec, we allow
-- all-column updates by participants for simplicity (status, ended_at,
-- duration_seconds, muted flags, was_speaker). Server-side webhook logic
-- can use service_role to override if disputed.
drop policy if exists "calls_update_participants" on public.calls;
create policy "calls_update_participants"
  on public.calls for update
  using (
    caller_id = auth.uid()
    or callee_id = auth.uid()
  )
  with check (
    caller_id = auth.uid()
    or callee_id = auth.uid()
  );

-- DELETE: NOT allowed. Call records are immutable history (for dispute
-- resolution, abuse detection, telecom-style call logs). No policy = no
-- delete possible for any non-service_role role.

-- ============================================================
-- Convenience: trigger to compute duration_seconds on end
-- ============================================================
-- Whenever a row transitions to a terminal status and ended_at is being set,
-- compute duration_seconds from accepted_at (or started_at when never accepted).
create or replace function public.calls_finalize_duration()
returns trigger
language plpgsql
as $$
begin
  -- Only act when ended_at is being newly set or changed
  if new.ended_at is not null
     and (old.ended_at is null or old.ended_at is distinct from new.ended_at) then
    -- Prefer accepted_at if available, otherwise started_at
    new.duration_seconds := greatest(
      0,
      extract(epoch from (new.ended_at - coalesce(new.accepted_at, new.started_at)))::int
    );
  end if;
  return new;
end;
$$;

drop trigger if exists calls_finalize_duration on public.calls;
create trigger calls_finalize_duration
  before update on public.calls
  for each row execute function public.calls_finalize_duration();
