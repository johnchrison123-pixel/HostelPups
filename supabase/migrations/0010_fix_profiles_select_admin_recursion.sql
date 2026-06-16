-- ============================================================
-- HostelPups — Fix profiles_select_admin RLS recursion
-- ============================================================
-- Migration 0005 created profiles_select_admin with a subquery
-- against public.profiles itself:
--
--   using ( exists (
--     select 1 from public.profiles p
--      where p.id = auth.uid() and p.role = 'admin'
--   ) )
--
-- That subquery re-evaluates RLS on profiles, which hits the
-- same admin policy again — infinite recursion. Postgres errors
-- the read with "infinite recursion detected in policy for
-- relation profiles", and ALL SELECTs on profiles fail.
--
-- The fix: route the admin check through public.is_admin() —
-- a SECURITY DEFINER function added in migration 0009 — which
-- bypasses RLS while it does the lookup.
--
-- Apply manually via Supabase SQL Editor.
-- Expand-only — no destructive changes. Safe to re-run.
-- ============================================================

drop policy if exists "profiles_select_admin" on public.profiles;

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- ============================================================
-- Verification
-- ============================================================
-- -- Should return 3 rows (admin, own, owners_public):
-- select polname from pg_policy
--  where polrelid = 'public.profiles'::regclass and polcmd = 'r';
--
-- -- Should return your profile row with role='admin' (NOT a recursion error):
-- select id, email, role from public.profiles where id = auth.uid();
