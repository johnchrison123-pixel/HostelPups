-- ============================================================
-- HostelPups — Storage buckets + policies (Phase 1)
-- ============================================================
-- Buckets:
--   listing-photos       — public-read, owner-write
--   avatars              — public-read, user-write
--   kyc-documents        — fully private (server/service_role only)
--   verification-videos  — fully private (server/service_role only)
--
-- Notes:
-- - Supabase Storage buckets live in the storage.buckets table.
-- - Per-object policies live on storage.objects.
-- - We use bucket_id in policies to scope rules per-bucket.
-- - Path convention: <user_uid>/<filename>.<ext>
--   The first path segment is enforced to be the uploader's UID
--   so users cannot overwrite each other's files.
-- ============================================================

-- ------------------------------------------------------------
-- Bucket creation (idempotent)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('listing-photos',      'listing-photos',      true),
  ('avatars',             'avatars',             true),
  ('kyc-documents',       'kyc-documents',       false),
  ('verification-videos', 'verification-videos', false)
on conflict (id) do nothing;

-- ============================================================
-- Storage policies
-- ============================================================
-- Note: storage.objects has RLS enabled by default in Supabase. We add
-- policies per bucket. The `auth.uid()` helper works the same as on
-- public.* tables.

-- ------------------------------------------------------------
-- listing-photos: public read, authenticated users write into their own folder
-- ------------------------------------------------------------
drop policy if exists "listing_photos_public_read" on storage.objects;
create policy "listing_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

drop policy if exists "listing_photos_owner_insert" on storage.objects;
create policy "listing_photos_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "listing_photos_owner_update" on storage.objects;
create policy "listing_photos_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "listing_photos_owner_delete" on storage.objects;
create policy "listing_photos_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ------------------------------------------------------------
-- avatars: public read, authenticated users write into their own folder
-- ------------------------------------------------------------
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_user_insert" on storage.objects;
create policy "avatars_user_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_user_update" on storage.objects;
create policy "avatars_user_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_user_delete" on storage.objects;
create policy "avatars_user_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ------------------------------------------------------------
-- kyc-documents: fully private. service_role only — no anon/authenticated policies.
-- ------------------------------------------------------------
-- (No SELECT/INSERT/UPDATE/DELETE policies created. service_role key
-- bypasses RLS and can read/write freely from server-side route handlers.)

-- ------------------------------------------------------------
-- verification-videos: fully private. service_role only.
-- ------------------------------------------------------------
-- (No policies created.)

-- ============================================================
-- TODO (manual): Set per-bucket file size + MIME limits in the
-- Supabase Dashboard → Storage → <bucket> → Configuration:
--   listing-photos:      max 5 MB, allow image/jpeg, image/png, image/webp
--   avatars:             max 2 MB, allow image/jpeg, image/png, image/webp
--   kyc-documents:       max 10 MB, allow application/pdf, image/jpeg, image/png
--   verification-videos: max 50 MB, allow video/mp4, video/quicktime
-- These can also be set via the Storage API but the dashboard is the
-- least-error-prone way for a first-time setup. See supabase/README.md.
-- ============================================================
