-- ============================================================
-- HostelPups — Call immutability + smarter inquiry-status trigger
-- ============================================================
-- Combines fixes for two audit findings:
--
--   C5: Inquiry status never returns to 'open' after renter replies.
--       The original `bump_inquiry_on_message` only flipped open→responded
--       when the owner sent a message. When the renter responded back the
--       status was stuck on 'responded' forever, polluting the
--       "response-rate" metric and the owner's inbox sort.
--
--   C6: Call rows mutable by participants.
--       The original `calls_update_participants` policy let either side
--       rewrite ANY column on the calls row — including caller_id /
--       callee_id / inquiry_id / started_at / created_at. This makes the
--       calls table useless as an authoritative dispute-resolution log:
--       a malicious party could mint duration, change identities, etc.
--
-- Apply this migration MANUALLY (founder, via the Supabase SQL Editor):
--   1. Open https://supabase.com/dashboard/project/<project>/sql
--   2. Paste this entire file → Run
--   3. Verify with the test queries at the bottom (commented).
--
-- Expand-contract: this migration only changes triggers + RLS policies
-- (no schema drops, no destructive column changes). Existing client code
-- continues to work — the trigger still sets status='responded' for owner
-- messages exactly as before, just now also lets renter replies flip it
-- back to 'open'.
-- ============================================================

-- ------------------------------------------------------------
-- C5: smarter bump_inquiry_on_message
-- ------------------------------------------------------------
-- Behaviour:
--   - sender is the listing owner → status = 'responded'
--   - sender is the inquiry user (renter) AND current status = 'responded'
--     → status = 'open'  (renter replied; ball is back in owner's court)
--   - status = 'closed' → never auto-flip (closed is sticky)
--
-- We don't touch the trigger registration — the existing
-- `bump_inquiry_on_message` trigger from 0001 fires AFTER INSERT on
-- public.messages and calls this function. Replacing the function is
-- enough.
create or replace function public.bump_inquiry_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id    uuid;
  v_user_id     uuid;
  v_status      text;
begin
  -- Resolve the inquiry's listing owner + renter + current status in one go.
  select l.owner_id, i.user_id, i.status
    into v_owner_id, v_user_id, v_status
  from public.inquiries i
  join public.listings l on l.id = i.listing_id
  where i.id = new.inquiry_id;

  -- A closed inquiry is sticky — explicit moderator action only.
  if v_status = 'closed' then
    return new;
  end if;

  -- Owner replied → mark as responded (always — even if already responded,
  -- this is a no-op).
  if v_owner_id is not null and new.sender_id = v_owner_id then
    if v_status = 'open' then
      update public.inquiries
        set status = 'responded'
        where id = new.inquiry_id and status = 'open';
    end if;
    return new;
  end if;

  -- Renter replied after owner had responded → ball back in owner's court.
  if v_user_id is not null
     and new.sender_id = v_user_id
     and v_status = 'responded' then
    update public.inquiries
      set status = 'open'
      where id = new.inquiry_id and status = 'responded';
  end if;

  return new;
end;
$$;

-- (Trigger itself is already created by 0001 — no need to re-register.)

-- ------------------------------------------------------------
-- C6: lock down call-row mutations
-- ------------------------------------------------------------
-- Step 1: drop the over-permissive update policy.
drop policy if exists "calls_update_participants" on public.calls;

-- Step 2: re-create the policy. Participants can update only mutable
-- operational columns — RLS itself can't compare OLD vs NEW directly
-- inside USING/WITH CHECK, so we keep USING/WITH CHECK to "participant"
-- and let the BEFORE UPDATE trigger below reject immutable-column edits.
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

-- Step 3: BEFORE UPDATE trigger that hard-rejects edits to identity /
-- timestamp columns and enforces duration_seconds-is-monotonic.
--
-- NOTE: this trigger is BEFORE the existing `calls_finalize_duration`
-- trigger (both fire at BEFORE UPDATE). Postgres orders BEFORE triggers
-- alphabetically by name — `calls_enforce_immutability` sorts before
-- `calls_finalize_duration`, so identity checks run first. If
-- `calls_finalize_duration` recomputes duration_seconds based on the new
-- ended_at, that recomputed value also flows through this trigger on the
-- NEXT update — fine, because monotonicity is checked against OLD, and
-- finalize_duration only ever increases it.
create or replace function public.calls_enforce_immutability()
returns trigger
language plpgsql
as $$
begin
  -- Identity & inquiry binding — frozen at insert.
  if new.inquiry_id is distinct from old.inquiry_id then
    raise exception 'calls.inquiry_id is immutable'
      using errcode = '42501';
  end if;
  if new.caller_id is distinct from old.caller_id then
    raise exception 'calls.caller_id is immutable'
      using errcode = '42501';
  end if;
  if new.callee_id is distinct from old.callee_id then
    raise exception 'calls.callee_id is immutable'
      using errcode = '42501';
  end if;

  -- Audit timestamps — frozen at insert.
  if new.started_at is distinct from old.started_at then
    raise exception 'calls.started_at is immutable'
      using errcode = '42501';
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception 'calls.created_at is immutable'
      using errcode = '42501';
  end if;

  -- duration_seconds is monotonic — can only stay equal or increase.
  -- (Rejecting decreases stops a malicious participant from rewinding a
  -- 12-minute call to 1 second.)
  if new.duration_seconds < old.duration_seconds then
    raise exception 'calls.duration_seconds cannot decrease (old=%, new=%)',
      old.duration_seconds, new.duration_seconds
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists calls_enforce_immutability on public.calls;
create trigger calls_enforce_immutability
  before update on public.calls
  for each row execute function public.calls_enforce_immutability();

-- ============================================================
-- Verification (uncomment to run after migration applies)
-- ============================================================
-- -- C5: spot-check the new function — should report the renter→open path.
-- select pg_get_functiondef('public.bump_inquiry_on_message'::regproc);
--
-- -- C6: list triggers on public.calls — should see BOTH
-- --     calls_enforce_immutability (BEFORE) and calls_finalize_duration (BEFORE).
-- select tgname, tgtype
-- from pg_trigger
-- where tgrelid = 'public.calls'::regclass
--   and not tgisinternal
-- order by tgname;
--
-- -- C6: confirm the new update policy.
-- select polname, polcmd
-- from pg_policy
-- where polrelid = 'public.calls'::regclass
-- order by polname;
