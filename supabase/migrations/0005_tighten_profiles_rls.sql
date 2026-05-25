-- ============================================================
-- HostelPups — Tighten profiles SELECT policy (privacy fix)
-- ============================================================
-- The previous `profiles_select_public USING (true)` policy let anonymous
-- visitors enumerate every user's email + phone. The phone-login flow used
-- this to look up email by phone — that path now goes through the
-- `findEmailByPhone` server action (src/lib/auth-actions.ts) which uses
-- the SERVICE ROLE key and validates input first.
--
-- New policy splits public visibility:
--   * Owners (role='owner') stay publicly readable because their
--     business_name + tier + verification badge appear on listing detail
--     pages and the city/wedge landings.
--   * Renters are only readable by themselves and admins.
--
-- This is a backward-compatible change with the prior code path AS LONG AS
-- the LoginForm has been updated in the same release to call
-- findEmailByPhone() instead of querying profiles directly. (Release B of
-- the Expand-Contract: client switch must ship together with this tighten.)
--
-- Run via Supabase Dashboard → SQL Editor (PENDING — user action).
-- ============================================================

drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_select_owners_public" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;

-- Owner profiles are public (business_name + role are shown on listings).
create policy "profiles_select_owners_public"
  on public.profiles for select
  using (role = 'owner');

-- A signed-in user can always read their own row.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins (role='admin') can read everyone — for support / moderation.
create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
