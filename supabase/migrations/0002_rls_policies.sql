-- ============================================================
-- HostelPups — Row Level Security policies (Phase 1)
-- ============================================================
-- These policies assume `auth.uid()` returns the authenticated user's
-- UUID from JWT. Server-side admin operations (e.g. webhook handlers,
-- cron jobs, payment confirmations) MUST use the service_role key and
-- bypass RLS entirely. Never expose the service_role key to the browser.
--
-- Reading flow:
--   - Anyone (anon) can read public-facing data: listings (status='live'),
--     profiles, owners, reviews, room_types, listing_photos (for live).
--   - Authenticated users own their inquiries/messages/favorites/reviews.
--   - Owners control their listings, photos, and room_types.
--   - payments + user_access are server-side only (no anon/authenticated insert).
-- ============================================================

-- ============================================================
-- Enable RLS on all 11 tables
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.owners          enable row level security;
alter table public.listings        enable row level security;
alter table public.room_types      enable row level security;
alter table public.listing_photos  enable row level security;
alter table public.inquiries       enable row level security;
alter table public.messages        enable row level security;
alter table public.favorites       enable row level security;
alter table public.reviews         enable row level security;
alter table public.payments        enable row level security;
alter table public.user_access     enable row level security;

-- ============================================================
-- profiles
-- ============================================================
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Note: INSERT into profiles is handled by the handle_new_user trigger
-- (SECURITY DEFINER), so no client-facing INSERT policy is needed.

-- ============================================================
-- owners
-- ============================================================
drop policy if exists "owners_select_public" on public.owners;
create policy "owners_select_public"
  on public.owners for select
  using (true);

drop policy if exists "owners_insert_own" on public.owners;
create policy "owners_insert_own"
  on public.owners for insert
  with check (auth.uid() = id);

drop policy if exists "owners_update_own" on public.owners;
create policy "owners_update_own"
  on public.owners for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "owners_delete_own" on public.owners;
create policy "owners_delete_own"
  on public.owners for delete
  using (auth.uid() = id);

-- ============================================================
-- listings
-- ============================================================
-- Public can see live listings; owners can see their own at any status;
-- admins (role='admin' on profiles) can see all.
drop policy if exists "listings_select_live_or_own_or_admin" on public.listings;
create policy "listings_select_live_or_own_or_admin"
  on public.listings for select
  using (
    status = 'live'
    or owner_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "listings_insert_own" on public.listings;
create policy "listings_insert_own"
  on public.listings for insert
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'owner'
    )
  );

drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own"
  on public.listings for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own"
  on public.listings for delete
  using (owner_id = auth.uid());

-- ============================================================
-- room_types
-- ============================================================
drop policy if exists "room_types_select" on public.room_types;
create policy "room_types_select"
  on public.room_types for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = room_types.listing_id
        and (l.status = 'live' or l.owner_id = auth.uid())
    )
  );

drop policy if exists "room_types_write_own" on public.room_types;
create policy "room_types_write_own"
  on public.room_types for all
  using (
    exists (
      select 1 from public.listings l
      where l.id = room_types.listing_id and l.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = room_types.listing_id and l.owner_id = auth.uid()
    )
  );

-- ============================================================
-- listing_photos
-- ============================================================
drop policy if exists "listing_photos_select" on public.listing_photos;
create policy "listing_photos_select"
  on public.listing_photos for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and (l.status = 'live' or l.owner_id = auth.uid())
    )
  );

drop policy if exists "listing_photos_write_own" on public.listing_photos;
create policy "listing_photos_write_own"
  on public.listing_photos for all
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id and l.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id and l.owner_id = auth.uid()
    )
  );

-- ============================================================
-- inquiries
-- ============================================================
-- Visible to the user who created it OR to the listing owner.
drop policy if exists "inquiries_select_participants" on public.inquiries;
create policy "inquiries_select_participants"
  on public.inquiries for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.owner_id = auth.uid()
    )
  );

-- Insert: user_id must equal auth.uid(), and the listing must be live.
drop policy if exists "inquiries_insert_self_on_live" on public.inquiries;
create policy "inquiries_insert_self_on_live"
  on public.inquiries for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.status = 'live'
    )
  );

-- Update: the listing owner can flip status (open → responded → closed).
-- The user can also update (e.g. close their own inquiry).
drop policy if exists "inquiries_update_participants" on public.inquiries;
create policy "inquiries_update_participants"
  on public.inquiries for update
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.owner_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.owner_id = auth.uid()
    )
  );

-- ============================================================
-- messages
-- ============================================================
-- Participants of the parent inquiry can read.
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
  on public.messages for select
  using (
    exists (
      select 1 from public.inquiries i
      left join public.listings l on l.id = i.listing_id
      where i.id = messages.inquiry_id
        and (i.user_id = auth.uid() or l.owner_id = auth.uid())
    )
  );

-- Insert: sender must be a participant of the inquiry AND sender_id = auth.uid().
drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.inquiries i
      left join public.listings l on l.id = i.listing_id
      where i.id = messages.inquiry_id
        and (i.user_id = auth.uid() or l.owner_id = auth.uid())
    )
  );

-- ============================================================
-- favorites
-- ============================================================
drop policy if exists "favorites_all_own" on public.favorites;
create policy "favorites_all_own"
  on public.favorites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- reviews
-- ============================================================
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
  on public.reviews for select
  using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews for insert
  with check (user_id = auth.uid());

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews for delete
  using (user_id = auth.uid());

-- ============================================================
-- payments — SERVER-SIDE WRITES ONLY (via service_role)
-- ============================================================
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments for select
  using (
    user_id = auth.uid()
    or owner_id = auth.uid()
  );

-- No INSERT/UPDATE/DELETE policies for non-service_role users. The service_role
-- key bypasses RLS entirely, so Razorpay webhook handlers can write freely.

-- ============================================================
-- user_access — SERVER-SIDE WRITES ONLY (via service_role)
-- ============================================================
drop policy if exists "user_access_select_own" on public.user_access;
create policy "user_access_select_own"
  on public.user_access for select
  using (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies. Server (service_role) manages tier transitions
-- via payment webhook callbacks.
