-- ============================================================
-- HostelPups — Persist city collected at signup into profiles
-- ============================================================
-- Both SignupForm and OwnerSignupForm collect a `city` value via the city
-- dropdown and stash it in auth.users.raw_user_meta_data.city. The
-- handle_new_user trigger only wrote id/email/phone/name, so the city was
-- effectively dropped.
--
-- This migration:
--   1. Adds `city` to public.profiles (nullable for backward compat).
--   2. Adds an index for filtering profiles by city (recommendation engine
--      / future "renters near you" feature).
--   3. Rewrites handle_new_user to also persist city from metadata.
--
-- Backward-compatible — old client code keeps working because the column
-- is nullable and defaults remain unchanged.
--
-- Run via Supabase Dashboard → SQL Editor (PENDING — user action).
-- ============================================================

alter table public.profiles
  add column if not exists city text;

create index if not exists profiles_city_idx
  on public.profiles (city);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone, name, city)
  values (
    new.id,
    new.email,
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'city'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
