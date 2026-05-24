-- ============================================================
-- HostelPups — Initial schema (Phase 1)
-- ============================================================
-- Tables: profiles, owners, listings, room_types, listing_photos,
--         inquiries, messages, favorites, reviews, payments, user_access
-- Triggers: set_updated_at, handle_new_user, bump_inquiry_on_message
--
-- Apply order: 0001_initial_schema → 0002_rls_policies → 0003_storage_setup → seed.sql
--
-- Schema follows expand-contract migration pattern: this is the
-- FIRST release (expand). No drops, no destructive changes.
-- ============================================================

-- Required extensions
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ------------------------------------------------------------
-- 1. profiles (one row per auth.users row, auto-created via trigger)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','owner','admin')),
  name text,
  phone text,
  email text,
  avatar_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'User-facing profile row, 1:1 with auth.users. Auto-created by handle_new_user trigger on signup.';

create index if not exists profiles_role_idx on public.profiles (role);

-- ------------------------------------------------------------
-- 2. owners (one row per profile.role=''owner'' user)
-- ------------------------------------------------------------
create table if not exists public.owners (
  id uuid primary key references public.profiles(id) on delete cascade,
  tier text not null default 'self_serve' check (tier in ('self_serve','full_service')),
  business_name text not null,
  kyc_status text not null default 'not_submitted'
    check (kyc_status in ('not_submitted','pending','verified','rejected')),
  kyc_documents jsonb not null default '[]'::jsonb,
  contact_phone text,
  has_verification_badge boolean not null default false,
  verification_expires_at timestamptz,
  registered_at timestamptz not null default now(),
  registration_expires_at timestamptz
);

comment on table public.owners is
  'Business owner data — KYC, tier (self_serve/full_service), verification badge, listing expiry.';

create index if not exists owners_tier_idx on public.owners (tier);
create index if not exists owners_kyc_status_idx on public.owners (kyc_status);

-- ------------------------------------------------------------
-- 3. listings
-- ------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  type text not null check (type in ('pg','hostel','flat','house','staycation')),
  title text not null,
  slug text not null,
  description text,
  city text not null,
  area text not null,
  address text,                                  -- gated behind paywall in client
  landmark text,
  lat numeric,                                   -- exact location, gated
  lng numeric,
  approx_lat numeric,                            -- jittered for public view
  approx_lng numeric,
  gender_pref text not null default 'any'
    check (gender_pref in ('any','men','women','couple','family')),
  wedge_tags text[] not null default '{}'::text[],
  amenities text[] not null default '{}'::text[],
  house_rules text[] not null default '{}'::text[],
  status text not null default 'draft'
    check (status in ('draft','pending_review','live','paused','full','rejected')),
  is_verified boolean not null default false,
  is_boosted_until timestamptz,
  available_from date,
  total_beds int,
  total_vacancies int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city, slug)
);

comment on table public.listings is
  'Property listings (PG/hostel/flat/house/staycation). Public when status=''live''.';

-- TODO: Postgres array element check constraints are awkward; wedge_tags values
-- are enforced client-side and via the WEDGE_TAGS enum in src/lib/site.ts.
-- A trigger could enforce membership server-side if needed in a future migration.

create index if not exists listings_city_idx on public.listings (city);
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_owner_id_idx on public.listings (owner_id);
create index if not exists listings_wedge_tags_idx on public.listings using gin (wedge_tags);
create index if not exists listings_amenities_idx on public.listings using gin (amenities);
create index if not exists listings_city_status_idx on public.listings (city, status);

-- ------------------------------------------------------------
-- 4. room_types
-- ------------------------------------------------------------
create table if not exists public.room_types (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  name text not null,                            -- "Single AC", "Double Sharing", etc.
  price_per_month numeric not null check (price_per_month >= 0),
  ac boolean not null default false,
  attached_bathroom boolean not null default false,
  occupancy int not null default 1,
  vacancies int not null default 0
);

comment on table public.room_types is
  'Room types within a listing, with price + occupancy + vacancy counts.';

create index if not exists room_types_listing_id_idx on public.room_types (listing_id);

-- ------------------------------------------------------------
-- 5. listing_photos
-- ------------------------------------------------------------
create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  display_order int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.listing_photos is
  'Photos uploaded for a listing. URLs point to listing-photos storage bucket.';

create index if not exists listing_photos_listing_id_idx on public.listing_photos (listing_id);

-- ------------------------------------------------------------
-- 6. inquiries (user expresses interest in a listing)
-- ------------------------------------------------------------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  status text not null default 'open'
    check (status in ('open','responded','closed')),
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

comment on table public.inquiries is
  'One inquiry per (user, listing) pair. Owner responds via messages table.';

create index if not exists inquiries_listing_id_idx on public.inquiries (listing_id);
create index if not exists inquiries_user_id_idx on public.inquiries (user_id);
create index if not exists inquiries_status_idx on public.inquiries (status);

-- ------------------------------------------------------------
-- 7. messages (chat thread under an inquiry)
-- ------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  was_redacted boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.messages is
  'Chat messages on an inquiry. was_redacted=true means redactContactInfo() stripped contact details.';

create index if not exists messages_inquiry_id_idx on public.messages (inquiry_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

-- ------------------------------------------------------------
-- 8. favorites (user saves listing for later)
-- ------------------------------------------------------------
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

comment on table public.favorites is
  'User-saved listings (heart icon). Composite PK on (user_id, listing_id).';

create index if not exists favorites_listing_id_idx on public.favorites (listing_id);

-- ------------------------------------------------------------
-- 9. reviews
-- ------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  content text,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

comment on table public.reviews is
  'User reviews of listings. One review per (user, listing).';

create index if not exists reviews_listing_id_idx on public.reviews (listing_id);

-- ------------------------------------------------------------
-- 10. payments
-- ------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  owner_id uuid references public.owners(id) on delete set null,
  amount numeric not null check (amount >= 0),
  currency text not null default 'INR',
  purpose text not null check (purpose in (
    'user_access_week','user_access_month','user_access_year','user_single_unlock',
    'owner_registration_full','owner_registration_self','owner_verification',
    'owner_boost','owner_renewal'
  )),
  status text not null default 'pending'
    check (status in ('pending','completed','failed','refunded')),
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now()
);

comment on table public.payments is
  'Razorpay payment records. user_id OR owner_id set depending on purpose. Server-side writes only.';

create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_owner_id_idx on public.payments (owner_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_razorpay_order_id_idx on public.payments (razorpay_order_id);

-- ------------------------------------------------------------
-- 11. user_access (current paid tier per user)
-- ------------------------------------------------------------
create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free'
    check (tier in ('free','week','month','year','single_unlock')),
  expires_at timestamptz,
  contacts_unlocked int not null default 0,
  contacts_remaining int not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.user_access is
  'Tracks each user''s current paid access tier and remaining unlocks. Server-side writes only.';

create index if not exists user_access_expires_at_idx on public.user_access (expires_at);

-- ============================================================
-- Triggers + functions
-- ============================================================

-- ---- set_updated_at: bumps updated_at on row update ----
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.listings;
create trigger set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.user_access;
create trigger set_updated_at
  before update on public.user_access
  for each row execute function public.set_updated_at();

-- ---- handle_new_user: auto-create profile row on auth.users insert ----
-- Standard Supabase pattern. Runs as SECURITY DEFINER so it can write to public.profiles
-- regardless of the JWT context of the inserting user (signup).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone, name)
  values (
    new.id,
    new.email,
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    new.raw_user_meta_data->>'name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- bump_inquiry_on_message: when a new message arrives on an "open" inquiry,
-- flip its status to "responded" if the sender is the listing owner ----
create or replace function public.bump_inquiry_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
begin
  -- Find the owner of the listing tied to this inquiry
  select l.owner_id into v_owner_id
  from public.inquiries i
  join public.listings l on l.id = i.listing_id
  where i.id = new.inquiry_id;

  -- Only bump status if the owner sent the message and inquiry is still open
  if v_owner_id is not null and new.sender_id = v_owner_id then
    update public.inquiries
      set status = 'responded'
      where id = new.inquiry_id and status = 'open';
  end if;

  return new;
end;
$$;

drop trigger if exists bump_inquiry_on_message on public.messages;
create trigger bump_inquiry_on_message
  after insert on public.messages
  for each row execute function public.bump_inquiry_on_message();
