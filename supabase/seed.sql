-- ============================================================
-- HostelPups — Seed data (Phase 1)
-- ============================================================
-- Seeds: 8 stub auth.users + 8 profiles + 8 owners + 20 listings + 35 room_types
--
-- Strategy notes:
-- - Mock IDs from src/lib/mockOwners.ts (e.g. "own_kerala_01") and
--   src/lib/mockListings.ts (e.g. "l_koc_01") are NOT UUIDs, but the DB
--   requires UUIDs. We use deterministic UUID v5 IDs derived from those
--   string keys — so re-running seed produces identical IDs, and the
--   client can hardcode them temporarily during cutover if needed.
-- - mockOwners has separate profile_id (prof_xxx) and owner.id (own_xxx).
--   Our schema collapses them: owners.id = profiles.id (1:1). We pick the
--   own_xxx → UUID mapping; the prof_xxx values are dropped.
-- - auth.users insertion uses gen_random_uuid()-style placeholders. These
--   stub rows have no password (encrypted_password = NULL). The founder
--   can later trigger Supabase password-reset flow to grant access to a
--   seed account, or just delete these rows once real owners sign up.
-- - All seeded listings are status='live' (regardless of pending_review
--   in mockListings) so the public search/landing pages have visible data.
--   The is_verified flag still mirrors the mock.
-- - listing_photos table is intentionally NOT seeded — we have no real
--   photo URLs; the client uses getListingGradient() placeholder for now.
--
-- Run AFTER 0001 and 0002. Safe to re-run (uses on conflict do nothing).
-- ============================================================

-- ============================================================
-- 1. Stub auth.users rows
-- ============================================================
-- The dashboard SQL editor runs as service_role, which can write auth.users
-- directly. These rows let the FK from public.profiles → auth.users hold.
-- We supply the minimum required columns. Passwords are NULL → these
-- accounts can't be signed in to until a password-reset flow is run.

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) values
  ('507199e2-6142-5c21-936c-cf87ebcb27b8'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'sundaram.properties@example.com',     null, now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Sundaram Properties"}'::jsonb, false),
  ('def29d3c-7e19-5b08-8145-ff794923fac4'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'krishna.hospitality@example.com',     null, now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Krishna Hospitality"}'::jsonb, false),
  ('380538c8-9720-5fdb-a70a-e4ecad0d0610'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'mariamma.george@example.com',         null, now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Mariamma George"}'::jsonb, false),
  ('85612e53-8b67-510f-bfc7-04460e0f2be1'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'bengaluru.stays@example.com',         null, now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Bengaluru Stays Pvt Ltd"}'::jsonb, false),
  ('20465738-1157-5aee-a446-ceb034465ade'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'anita.reddy@example.com',             null, now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Anita Reddy Rentals"}'::jsonb, false),
  ('179fca27-df73-5cb0-9a2b-b21c1ea9478c'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'saravana.bhavan.pg@example.com',      null, now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Saravana Bhavan PG"}'::jsonb, false),
  ('328ae337-43b1-5331-a834-f003d9a58b47'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'faisal.ahmed@example.com',            null, now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Faisal Ahmed Properties"}'::jsonb, false),
  ('287e1e5e-dfec-5814-aa63-9903a228bdb7'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'suja.nambiar@example.com',            null, now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Suja Nambiar"}'::jsonb, false)
on conflict (id) do nothing;

-- ============================================================
-- 2. profiles
-- ============================================================
-- The handle_new_user trigger normally creates these rows automatically,
-- but to keep seed deterministic we upsert explicitly (and set role='owner').
insert into public.profiles (id, role, name, phone, email, verified) values
  ('507199e2-6142-5c21-936c-cf87ebcb27b8'::uuid, 'owner', 'Sundaram Properties',     '+919876500001', 'sundaram.properties@example.com', true),
  ('def29d3c-7e19-5b08-8145-ff794923fac4'::uuid, 'owner', 'Krishna Hospitality',     '+919876500002', 'krishna.hospitality@example.com', true),
  ('380538c8-9720-5fdb-a70a-e4ecad0d0610'::uuid, 'owner', 'Mariamma George',         '+919876500003', 'mariamma.george@example.com',     true),
  ('85612e53-8b67-510f-bfc7-04460e0f2be1'::uuid, 'owner', 'Bengaluru Stays Pvt Ltd', '+919876500004', 'bengaluru.stays@example.com',     true),
  ('20465738-1157-5aee-a446-ceb034465ade'::uuid, 'owner', 'Anita Reddy Rentals',     '+919876500005', 'anita.reddy@example.com',         true),
  ('179fca27-df73-5cb0-9a2b-b21c1ea9478c'::uuid, 'owner', 'Saravana Bhavan PG',      '+919876500006', 'saravana.bhavan.pg@example.com',  true),
  ('328ae337-43b1-5331-a834-f003d9a58b47'::uuid, 'owner', 'Faisal Ahmed Properties', '+919876500007', 'faisal.ahmed@example.com',        true),
  ('287e1e5e-dfec-5814-aa63-9903a228bdb7'::uuid, 'owner', 'Suja Nambiar',            '+919876500008', 'suja.nambiar@example.com',        true)
on conflict (id) do update set
  role = excluded.role,
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  verified = excluded.verified;

-- ============================================================
-- 3. owners
-- ============================================================
insert into public.owners (
  id, tier, business_name, kyc_status,
  contact_phone, has_verification_badge, verification_expires_at,
  registered_at, registration_expires_at
) values
  ('507199e2-6142-5c21-936c-cf87ebcb27b8'::uuid, 'full_service', 'Sundaram Properties',     'verified', '+919876500001', true,  '2027-05-23T00:00:00Z'::timestamptz, '2025-09-12T00:00:00Z'::timestamptz, '2026-09-12T00:00:00Z'::timestamptz),
  ('def29d3c-7e19-5b08-8145-ff794923fac4'::uuid, 'full_service', 'Krishna Hospitality',     'verified', '+919876500002', true,  '2027-05-23T00:00:00Z'::timestamptz, '2025-08-04T00:00:00Z'::timestamptz, '2026-08-04T00:00:00Z'::timestamptz),
  ('380538c8-9720-5fdb-a70a-e4ecad0d0610'::uuid, 'self_serve',   'Mariamma George',         'verified', '+919876500003', true,  null,                                  '2025-10-19T00:00:00Z'::timestamptz, '2026-10-19T00:00:00Z'::timestamptz),
  ('85612e53-8b67-510f-bfc7-04460e0f2be1'::uuid, 'full_service', 'Bengaluru Stays Pvt Ltd', 'verified', '+919876500004', true,  '2027-05-23T00:00:00Z'::timestamptz, '2025-11-02T00:00:00Z'::timestamptz, '2026-11-02T00:00:00Z'::timestamptz),
  ('20465738-1157-5aee-a446-ceb034465ade'::uuid, 'self_serve',   'Anita Reddy Rentals',     'verified', '+919876500005', false, null,                                  '2026-01-15T00:00:00Z'::timestamptz, '2027-01-15T00:00:00Z'::timestamptz),
  ('179fca27-df73-5cb0-9a2b-b21c1ea9478c'::uuid, 'full_service', 'Saravana Bhavan PG',      'verified', '+919876500006', true,  '2027-05-23T00:00:00Z'::timestamptz, '2025-12-07T00:00:00Z'::timestamptz, '2026-12-07T00:00:00Z'::timestamptz),
  ('328ae337-43b1-5331-a834-f003d9a58b47'::uuid, 'self_serve',   'Faisal Ahmed Properties', 'verified', '+919876500007', true,  null,                                  '2026-02-11T00:00:00Z'::timestamptz, '2027-02-11T00:00:00Z'::timestamptz),
  ('287e1e5e-dfec-5814-aa63-9903a228bdb7'::uuid, 'self_serve',   'Suja Nambiar',            'verified', '+919876500008', false, null,                                  '2026-03-04T00:00:00Z'::timestamptz, '2027-03-04T00:00:00Z'::timestamptz)
on conflict (id) do update set
  tier = excluded.tier,
  business_name = excluded.business_name,
  kyc_status = excluded.kyc_status,
  contact_phone = excluded.contact_phone,
  has_verification_badge = excluded.has_verification_badge,
  verification_expires_at = excluded.verification_expires_at,
  registered_at = excluded.registered_at,
  registration_expires_at = excluded.registration_expires_at;

-- ============================================================
-- 4. listings (20 rows)
-- ============================================================
-- All seeded as status='live' so the public site has data to render even
-- before owners go through review. is_verified mirrors mockListings.

insert into public.listings (
  id, owner_id, type, title, slug, description, city, area, landmark,
  approx_lat, approx_lng, gender_pref, wedge_tags, amenities, house_rules,
  status, is_verified, total_beds, total_vacancies, created_at, updated_at
) values
-- ---------- KOCHI (6) ----------
(
  'a7967889-68b9-5294-973c-4d95e1c71902'::uuid,
  '507199e2-6142-5c21-936c-cf87ebcb27b8'::uuid, -- own_kerala_01
  'pg', 'Sunshine PG', 'sunshine-pg-edappally',
  'Modern PG just 8 minutes from Lulu Mall and Edappally Junction. Single and double rooms with AC, attached bathrooms, and home-cooked Kerala meals included. Walking distance to Edappally metro.',
  'kochi', 'Edappally', 'Lulu Mall',
  10.025, 76.308, 'women',
  array['women','student']::text[],
  array['wifi','food','laundry','ac','hot_water','security','housekeeping']::text[],
  array['No smoking','Entry by 10:30 PM','Guests only in common area']::text[],
  'live', true, 24, 4,
  '2025-09-15T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  '80ba7785-5534-567e-b5e0-f7b74d0448a4'::uuid,
  'def29d3c-7e19-5b08-8145-ff794923fac4'::uuid, -- own_kerala_02
  'pg', 'Techie Nest PG', 'techie-nest-pg-kakkanad',
  'Bachelor-friendly PG built for Infopark techies. 5-minute walk to Infopark Phase 1, 24/7 power backup, high-speed Wi-Fi, gym access, and a dedicated study room. AC and non-AC options.',
  'kochi', 'Kakkanad', 'Infopark Phase 1',
  10.014, 76.355, 'men',
  array['bachelor','men','student']::text[],
  array['wifi','food','gym','ac','power_backup','parking','study_room']::text[],
  array['No smoking indoors','Quiet hours after 11 PM','Visitors limited to lobby']::text[],
  'live', true, 30, 6,
  '2025-08-12T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  'cf992dd7-df20-5dc8-b0fa-372660dfa045'::uuid,
  '380538c8-9720-5fdb-a70a-e4ecad0d0610'::uuid, -- own_kerala_03
  'flat', 'Casa Cozy Couple Studio', 'casa-cozy-couple-studio-kaloor',
  'Cozy 1BHK studio in central Kaloor — explicitly couple-friendly. Fully furnished, modular kitchen, washing machine, dedicated parking. Society pre-approved for unmarried couples on long-stay leases.',
  'kochi', 'Kaloor', 'Kaloor Stadium',
  9.985, 76.298, 'couple',
  array['couple']::text[],
  array['wifi','ac','laundry','parking','balcony','hot_water']::text[],
  array['Long-stay only (3 month minimum)','No loud parties','No additional guests overnight']::text[],
  'live', true, 1, 1,
  '2025-10-22T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  'd819b2aa-58b7-50e8-8544-c51de8532051'::uuid,
  '507199e2-6142-5c21-936c-cf87ebcb27b8'::uuid, -- own_kerala_01
  'hostel', 'Greenview Boys Hostel', 'greenview-boys-hostel-vyttila',
  'Affordable boys hostel near Vyttila Mobility Hub. Triple and quad sharing rooms, three home-cooked meals daily, sports room, and 24/7 security. Walking distance to Vyttila metro and bus stand.',
  'kochi', 'Vyttila', 'Vyttila Mobility Hub',
  9.967, 76.318, 'men',
  array['men','bachelor','student']::text[],
  array['wifi','food','laundry','security','common_kitchen','study_room']::text[],
  array['No alcohol on premises','Entry by 11 PM','No outside food in rooms']::text[],
  'live', true, 40, 12,
  '2025-11-08T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  'f7e4231d-ddc4-5345-87e2-d177d93db556'::uuid,
  'def29d3c-7e19-5b08-8145-ff794923fac4'::uuid, -- own_kerala_02
  'flat', 'Pawfect Stay Aluva', 'pawfect-stay-aluva',
  'Pet-friendly 2BHK flat in Aluva — bring your dog or cat without negotiation. Tiled flooring, balcony with grill, ground-floor for easy pet walks, and society pre-approved for pets up to medium-sized dogs.',
  'kochi', 'Aluva', 'Aluva Metro Station',
  10.106, 76.353, 'family',
  array['pet','family']::text[],
  array['wifi','ac','parking','balcony','hot_water','housekeeping']::text[],
  array['Pets allowed (dogs / cats / small pets)','No exotic animals','Refundable pet deposit Rs 5,000']::text[],
  'live', true, 2, 1,
  '2025-12-01T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  '236cd6cd-8da2-5855-b92c-f67db9832083'::uuid,
  '380538c8-9720-5fdb-a70a-e4ecad0d0610'::uuid, -- own_kerala_03
  'pg', 'Fort Heritage PG', 'fort-heritage-pg-fort-kochi',
  'Charming heritage-style PG in Fort Kochi, perfect for solo travelers, freelancers, and remote workers. Walking distance to beach, cafes, and the Chinese fishing nets. Mixed-gender with strict community rules.',
  'kochi', 'Fort Kochi', 'Chinese Fishing Nets',
  9.965, 76.245, 'any',
  array['bachelor']::text[],
  array['wifi','food','laundry','hot_water','common_kitchen','terrace_access']::text[],
  array['No smoking','Music off after 10 PM','Common kitchen cleaning roster']::text[],
  'live', false, 14, 3,
  '2026-04-09T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
-- ---------- BANGALORE (4) ----------
(
  '22a83b6b-3c97-54bc-84a1-3aea63a4275c'::uuid,
  '85612e53-8b67-510f-bfc7-04460e0f2be1'::uuid, -- own_blr_01
  'flat', 'Pawfect Home Marathahalli', 'pawfect-home-marathahalli',
  'Premium pet-friendly 2BHK in Marathahalli — close to ORR tech corridor and a 10-minute drive to Whitefield. Society allows pets up to 25kg. Comes with refundable pet deposit and washing area.',
  'bangalore', 'Marathahalli', 'Marathahalli Bridge',
  12.957, 77.701, 'couple',
  array['pet','couple']::text[],
  array['wifi','ac','parking','balcony','power_backup','security']::text[],
  array['Pet deposit Rs 10,000 refundable','No exotic pets','Society quiet hours after 10 PM']::text[],
  'live', true, 2, 1,
  '2025-11-15T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  '8e9a5749-18f1-55d5-8214-1f018196d18c'::uuid,
  '85612e53-8b67-510f-bfc7-04460e0f2be1'::uuid, -- own_blr_01
  'pg', 'Skyline PG', 'skyline-pg-hsr-layout',
  'Women-only PG in HSR Layout''s tech belt. AC rooms, three meals daily, doctor on call, and biometric entry. Walking distance to several startups and 15 minutes to Koramangala.',
  'bangalore', 'HSR Layout', '27th Main HSR',
  12.911, 77.638, 'women',
  array['women','student']::text[],
  array['wifi','food','ac','laundry','security','housekeeping','power_backup']::text[],
  array['Biometric entry/exit','Entry by 10 PM','No male visitors past lobby']::text[],
  'live', true, 36, 5,
  '2025-12-18T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  '4e5cdc37-5bca-5446-ba47-da590ddd0db1'::uuid,
  '20465738-1157-5aee-a446-ceb034465ade'::uuid, -- own_blr_02
  'hostel', 'Brindavan Bachelors PG', 'brindavan-bachelors-pg-koramangala',
  'Bachelor-friendly hostel-style PG in 5th Block Koramangala. Walking distance to Forum Mall, ample co-working space, weekly cricket meetups on the terrace, and zero curfew on weekends.',
  'bangalore', 'Koramangala', 'Forum Mall',
  12.934, 77.624, 'men',
  array['bachelor','men']::text[],
  array['wifi','food','laundry','gym','study_room','terrace_access']::text[],
  array['Weekday quiet hours 11pm-6am','Common kitchen weekend access','Visitors register at gate']::text[],
  'live', true, 28, 9,
  '2026-01-22T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  '72c4a040-f333-528d-b48a-41f7fe37bd7a'::uuid,
  '20465738-1157-5aee-a446-ceb034465ade'::uuid, -- own_blr_02
  'pg', 'Maple Heights PG', 'maple-heights-pg-whitefield',
  'Premium co-living PG in Whitefield''s ITPL belt. Studio-style private rooms, daily housekeeping, weekly linen change, in-house cafe, and free shuttle to ITPL on weekdays.',
  'bangalore', 'Whitefield', 'ITPL',
  12.972, 77.749, 'any',
  array['bachelor']::text[],
  array['wifi','food','ac','laundry','gym','housekeeping','power_backup','parking']::text[],
  array['Smoking only in designated area','No loud music after 10pm','Subletting prohibited']::text[],
  'live', false, 48, 12,
  '2026-03-30T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
-- ---------- CHENNAI (3) ----------
(
  '7c5b72f1-50d7-55d1-848f-4b349b4503ed'::uuid,
  '179fca27-df73-5cb0-9a2b-b21c1ea9478c'::uuid, -- own_chn_01
  'pg', 'Lakshmi Hostel', 'lakshmi-hostel-omr',
  'Family-run women''s PG on Old Mahabalipuram Road. Vegetarian South Indian meals, daily prayer room access, and warden on-site. 10 minutes to Tidel Park, walking distance to OMR bus stops.',
  'chennai', 'OMR', 'Tidel Park',
  12.954, 80.241, 'women',
  array['women','student','family']::text[],
  array['wifi','food','laundry','hot_water','security','housekeeping']::text[],
  array['Vegetarian only','Entry by 9:30 PM','Saturday warden meeting']::text[],
  'live', true, 22, 3,
  '2025-12-15T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  '1de2da3b-3172-5d5e-ba86-b92196a1733c'::uuid,
  '179fca27-df73-5cb0-9a2b-b21c1ea9478c'::uuid, -- own_chn_01
  'hostel', 'RBR Residency Hostel', 'rbr-residency-hostel-velachery',
  'Budget-friendly mixed hostel in Velachery — 2 minutes from MRTS station. Triple and dorm sharing options. Includes Wi-Fi, daily housekeeping, and a common TV room with sports channels.',
  'chennai', 'Velachery', 'Velachery MRTS',
  12.978, 80.221, 'any',
  array['bachelor','student']::text[],
  array['wifi','laundry','common_kitchen','security','hot_water']::text[],
  array['Quiet hours 11pm-6am','No alcohol indoors','Bunk bedding only']::text[],
  'live', true, 36, 14,
  '2026-01-08T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  'be566e17-88af-5673-a724-95cd745adce6'::uuid,
  '328ae337-43b1-5331-a834-f003d9a58b47'::uuid, -- own_chn_02
  'flat', 'Anna Nagar Comfort Stay', 'anna-nagar-comfort-stay',
  'Family-friendly 2BHK flat in Anna Nagar West, gated society with playground and 24/7 security. Perfect for working couples or small families. Includes scheduled deep-cleaning every fortnight.',
  'chennai', 'Anna Nagar', 'Anna Nagar Tower',
  13.085, 80.218, 'family',
  array['family','couple']::text[],
  array['wifi','ac','parking','balcony','security','housekeeping','power_backup']::text[],
  array['Long-stay 6 month min','Society guest register','No bachelors groups']::text[],
  'live', false, 2, 1,
  '2026-04-19T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
-- ---------- TRIVANDRUM (3) ----------
(
  '40eb1230-c754-5414-bed8-8a1d98751946'::uuid,
  '507199e2-6142-5c21-936c-cf87ebcb27b8'::uuid, -- own_kerala_01
  'pg', 'PrimeStay PG', 'primestay-pg-technopark',
  'Located right inside Technopark Phase 3 cluster. Working-professional focused — early breakfast, late dinner, weekend brunch. AC rooms with study tables and standing desks. 3-minute walk to office gates.',
  'trivandrum', 'Technopark', 'Technopark Phase 3',
  8.557, 76.882, 'any',
  array['bachelor','student']::text[],
  array['wifi','food','ac','laundry','power_backup','study_room']::text[],
  array['Quiet zone after 11 PM','Visitors only in lobby','Power backup till 8 hours']::text[],
  'live', true, 20, 4,
  '2025-10-04T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  'f2b0e49a-f9d7-51a7-b0b6-efbd50fb177b'::uuid,
  'def29d3c-7e19-5b08-8145-ff794923fac4'::uuid, -- own_kerala_02
  'hostel', 'Krishna Nivas Hostel', 'krishna-nivas-hostel-kazhakuttam',
  'Women-only hostel near Kazhakuttam. Authentic Kerala-style meals, dedicated study room, prayer corner, and warden supervision. 10 minutes to Technopark via auto.',
  'trivandrum', 'Kazhakuttam', 'Kazhakuttam Junction',
  8.575, 76.875, 'women',
  array['women','student']::text[],
  array['wifi','food','laundry','hot_water','security','housekeeping','study_room']::text[],
  array['Vegetarian only','Entry by 9 PM','Family visitor approval required']::text[],
  'live', true, 30, 6,
  '2025-11-19T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  'be0e20ef-5566-5391-a6c0-7b7151c51784'::uuid,
  '380538c8-9720-5fdb-a70a-e4ecad0d0610'::uuid, -- own_kerala_03
  'flat', 'Tulip Co-Living Studio', 'tulip-co-living-studio-sasthamangalam',
  'Stylish co-living studio in the upscale Sasthamangalam neighbourhood. Couple-friendly with society approval, fully furnished, in-house laundry, and walking distance to cafes and Vellayambalam.',
  'trivandrum', 'Sasthamangalam', 'Sasthamangalam Junction',
  8.512, 76.961, 'couple',
  array['couple']::text[],
  array['wifi','ac','laundry','parking','balcony','hot_water']::text[],
  array['3 month minimum lease','Society guest log','No subletting']::text[],
  'live', true, 1, 1,
  '2026-02-14T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
-- ---------- CALICUT (2) ----------
(
  'f29a5321-2126-5ef6-ab53-49b018a5f394'::uuid,
  '287e1e5e-dfec-5814-aa63-9903a228bdb7'::uuid, -- own_calicut_01
  'hostel', 'NIT Greens Hostel', 'nit-greens-hostel-nit-campus',
  'Affordable engineering-student focused hostel walking distance from NIT Calicut main gate. Triple sharing, mess included, dedicated study floor, and 24/7 power backup during exam season.',
  'calicut', 'NIT Campus', 'NIT Calicut Main Gate',
  11.321, 75.935, 'men',
  array['student','men','bachelor']::text[],
  array['wifi','food','laundry','power_backup','study_room','common_kitchen']::text[],
  array['Quiet hours 10pm-6am','Mess timings fixed','No outside food in study room']::text[],
  'live', true, 60, 15,
  '2026-01-30T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  'c1ca5631-ac30-5c7e-9a1a-0d84deeddc73'::uuid,
  '287e1e5e-dfec-5814-aa63-9903a228bdb7'::uuid, -- own_calicut_01
  'pg', 'Cyberpark Studio PG', 'cyberpark-studio-pg-cyberpark',
  'Modern studio-style PG inside the Cyberpark Calicut tech belt. Designed for working professionals — flexible meal timing, in-house cafe, dedicated parking, and high-speed internet.',
  'calicut', 'Cyberpark', 'Calicut Cyberpark',
  11.273, 75.819, 'any',
  array['bachelor','couple']::text[],
  array['wifi','food','ac','laundry','parking','power_backup','housekeeping']::text[],
  array['Flexible entry with biometric','Visitors register at lobby','No smoking indoors']::text[],
  'live', false, 18, 6,
  '2026-04-11T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
-- ---------- TRICHUR (2) ----------
(
  'e19e58ce-8b41-5b9d-ba9e-fafe7dc65e5f'::uuid,
  'def29d3c-7e19-5b08-8145-ff794923fac4'::uuid, -- own_kerala_02
  'pg', 'Medico PG', 'medico-pg-medical-college',
  'Medical-student-focused PG opposite Government Medical College Thrissur. Quiet study environment, midnight library access, 24/7 power backup, and on-call mess service for night-shift PG students.',
  'trichur', 'Medical College', 'Government Medical College',
  10.547, 76.207, 'women',
  array['women','student']::text[],
  array['wifi','food','laundry','hot_water','study_room','power_backup','security']::text[],
  array['Quiet floor on study level','Entry pass after 10 PM','Visitors at warden discretion']::text[],
  'live', true, 24, 4,
  '2025-12-22T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
),
(
  'aa560135-49eb-5346-91f6-a4c24699b5b9'::uuid,
  '380538c8-9720-5fdb-a70a-e4ecad0d0610'::uuid, -- own_kerala_03
  'flat', 'Town Hall Family Flat', 'town-hall-family-flat-town-hall',
  'Spacious 2BHK family flat near Trichur Town Hall. Walking distance to Round, schools, and the railway station. Suitable for working couples and small families, with society playground and 24/7 security.',
  'trichur', 'Town Hall', 'Trichur Round',
  10.521, 76.214, 'family',
  array['family','couple','pet']::text[],
  array['wifi','parking','balcony','security','power_backup','housekeeping']::text[],
  array['Pets allowed (small / medium)','Long-stay 6 months','Society visitor approval']::text[],
  'live', true, 2, 1,
  '2026-02-28T00:00:00Z'::timestamptz, '2026-05-20T00:00:00Z'::timestamptz
)
on conflict (city, slug) do update set
  owner_id = excluded.owner_id,
  type = excluded.type,
  title = excluded.title,
  description = excluded.description,
  area = excluded.area,
  landmark = excluded.landmark,
  approx_lat = excluded.approx_lat,
  approx_lng = excluded.approx_lng,
  gender_pref = excluded.gender_pref,
  wedge_tags = excluded.wedge_tags,
  amenities = excluded.amenities,
  house_rules = excluded.house_rules,
  status = excluded.status,
  is_verified = excluded.is_verified,
  total_beds = excluded.total_beds,
  total_vacancies = excluded.total_vacancies,
  updated_at = excluded.updated_at;

-- ============================================================
-- 5. room_types (35 rows)
-- ============================================================
-- We DELETE existing room_types for these listings before inserting so
-- re-seeds are idempotent without needing a synthetic unique key.
delete from public.room_types
where listing_id in (
  'a7967889-68b9-5294-973c-4d95e1c71902'::uuid,
  '80ba7785-5534-567e-b5e0-f7b74d0448a4'::uuid,
  'cf992dd7-df20-5dc8-b0fa-372660dfa045'::uuid,
  'd819b2aa-58b7-50e8-8544-c51de8532051'::uuid,
  'f7e4231d-ddc4-5345-87e2-d177d93db556'::uuid,
  '236cd6cd-8da2-5855-b92c-f67db9832083'::uuid,
  '22a83b6b-3c97-54bc-84a1-3aea63a4275c'::uuid,
  '8e9a5749-18f1-55d5-8214-1f018196d18c'::uuid,
  '4e5cdc37-5bca-5446-ba47-da590ddd0db1'::uuid,
  '72c4a040-f333-528d-b48a-41f7fe37bd7a'::uuid,
  '7c5b72f1-50d7-55d1-848f-4b349b4503ed'::uuid,
  '1de2da3b-3172-5d5e-ba86-b92196a1733c'::uuid,
  'be566e17-88af-5673-a724-95cd745adce6'::uuid,
  '40eb1230-c754-5414-bed8-8a1d98751946'::uuid,
  'f2b0e49a-f9d7-51a7-b0b6-efbd50fb177b'::uuid,
  'be0e20ef-5566-5391-a6c0-7b7151c51784'::uuid,
  'f29a5321-2126-5ef6-ab53-49b018a5f394'::uuid,
  'c1ca5631-ac30-5c7e-9a1a-0d84deeddc73'::uuid,
  'e19e58ce-8b41-5b9d-ba9e-fafe7dc65e5f'::uuid,
  'aa560135-49eb-5346-91f6-a4c24699b5b9'::uuid
);

insert into public.room_types (listing_id, name, price_per_month, ac, attached_bathroom, occupancy, vacancies) values
-- L1 Sunshine PG (kochi)
('a7967889-68b9-5294-973c-4d95e1c71902'::uuid, 'Single AC',          9500, true,  true,  1, 1),
('a7967889-68b9-5294-973c-4d95e1c71902'::uuid, 'Double Sharing AC',  6500, true,  true,  2, 2),
('a7967889-68b9-5294-973c-4d95e1c71902'::uuid, 'Triple Sharing',     4800, false, false, 3, 1),
-- L2 Techie Nest PG (kochi)
('80ba7785-5534-567e-b5e0-f7b74d0448a4'::uuid, 'Single AC',         11000, true,  true,  1, 2),
('80ba7785-5534-567e-b5e0-f7b74d0448a4'::uuid, 'Double Sharing AC',  7800, true,  true,  2, 4),
-- L3 Casa Cozy (kochi)
('cf992dd7-df20-5dc8-b0fa-372660dfa045'::uuid, 'Couple Studio',     18500, true,  true,  2, 1),
-- L4 Greenview Boys Hostel (kochi)
('d819b2aa-58b7-50e8-8544-c51de8532051'::uuid, 'Triple Sharing',     4500, false, false, 3, 6),
('d819b2aa-58b7-50e8-8544-c51de8532051'::uuid, 'Quad Sharing',       3800, false, false, 4, 6),
-- L5 Pawfect Stay Aluva (kochi)
('f7e4231d-ddc4-5345-87e2-d177d93db556'::uuid, '2BHK Whole Flat',   22000, true,  true,  4, 1),
-- L6 Fort Heritage PG (kochi)
('236cd6cd-8da2-5855-b92c-f67db9832083'::uuid, 'Single Non-AC',      8500, false, true,  1, 1),
('236cd6cd-8da2-5855-b92c-f67db9832083'::uuid, 'Double Sharing',     5800, false, false, 2, 2),
-- L7 Pawfect Home Marathahalli (blr)
('22a83b6b-3c97-54bc-84a1-3aea63a4275c'::uuid, '2BHK Whole Flat',   28000, true,  true,  4, 1),
-- L8 Skyline PG HSR (blr)
('8e9a5749-18f1-55d5-8214-1f018196d18c'::uuid, 'Single AC',         14500, true,  true,  1, 1),
('8e9a5749-18f1-55d5-8214-1f018196d18c'::uuid, 'Double Sharing AC', 10800, true,  true,  2, 4),
-- L9 Brindavan Bachelors PG (blr)
('4e5cdc37-5bca-5446-ba47-da590ddd0db1'::uuid, 'Single Non-AC',     12000, false, true,  1, 3),
('4e5cdc37-5bca-5446-ba47-da590ddd0db1'::uuid, 'Double Sharing',     8500, false, false, 2, 6),
-- L10 Maple Heights PG Whitefield (blr)
('72c4a040-f333-528d-b48a-41f7fe37bd7a'::uuid, 'Studio Single AC',  18500, true,  true,  1, 5),
('72c4a040-f333-528d-b48a-41f7fe37bd7a'::uuid, 'Double Sharing AC', 12500, true,  true,  2, 7),
-- L11 Lakshmi Hostel OMR (chn)
('7c5b72f1-50d7-55d1-848f-4b349b4503ed'::uuid, 'Single Non-AC',     10500, false, true,  1, 1),
('7c5b72f1-50d7-55d1-848f-4b349b4503ed'::uuid, 'Double Sharing AC',  8200, true,  true,  2, 2),
-- L12 RBR Residency Hostel Velachery (chn)
('1de2da3b-3172-5d5e-ba86-b92196a1733c'::uuid, 'Triple Sharing',     5500, false, false, 3, 6),
('1de2da3b-3172-5d5e-ba86-b92196a1733c'::uuid, 'Dorm 6-Sharing',     4200, false, false, 6, 8),
-- L13 Anna Nagar Comfort Stay (chn)
('be566e17-88af-5673-a724-95cd745adce6'::uuid, '2BHK Whole Flat',   26500, true,  true,  4, 1),
-- L14 PrimeStay PG Technopark (tvm)
('40eb1230-c754-5414-bed8-8a1d98751946'::uuid, 'Single AC',         11500, true,  true,  1, 2),
('40eb1230-c754-5414-bed8-8a1d98751946'::uuid, 'Double Sharing AC',  8200, true,  true,  2, 2),
-- L15 Krishna Nivas Hostel Kazhakuttam (tvm)
('f2b0e49a-f9d7-51a7-b0b6-efbd50fb177b'::uuid, 'Triple Sharing',     4900, false, false, 3, 3),
('f2b0e49a-f9d7-51a7-b0b6-efbd50fb177b'::uuid, 'Double Sharing',     6500, false, true,  2, 3),
-- L16 Tulip Co-Living Studio Sasthamangalam (tvm)
('be0e20ef-5566-5391-a6c0-7b7151c51784'::uuid, 'Couple Studio',     17000, true,  true,  2, 1),
-- L17 NIT Greens Hostel (clt)
('f29a5321-2126-5ef6-ab53-49b018a5f394'::uuid, 'Triple Sharing',     4800, false, false, 3, 9),
('f29a5321-2126-5ef6-ab53-49b018a5f394'::uuid, 'Quad Sharing',       4200, false, false, 4, 6),
-- L18 Cyberpark Studio PG (clt)
('c1ca5631-ac30-5c7e-9a1a-0d84deeddc73'::uuid, 'Studio Single AC',  13500, true,  true,  1, 3),
('c1ca5631-ac30-5c7e-9a1a-0d84deeddc73'::uuid, 'Double Sharing AC',  9000, true,  true,  2, 3),
-- L19 Medico PG (trc)
('e19e58ce-8b41-5b9d-ba9e-fafe7dc65e5f'::uuid, 'Single AC',          9500, true,  true,  1, 1),
('e19e58ce-8b41-5b9d-ba9e-fafe7dc65e5f'::uuid, 'Double Sharing',     6800, false, true,  2, 3),
-- L20 Town Hall Family Flat (trc)
('aa560135-49eb-5346-91f6-a4c24699b5b9'::uuid, '2BHK Whole Flat',   19500, false, true,  4, 1);

-- ============================================================
-- Sanity counts (run as standalone queries to verify)
-- ============================================================
-- select count(*) from public.profiles;          -- expect 8
-- select count(*) from public.owners;            -- expect 8
-- select count(*) from public.listings;          -- expect 20
-- select count(*) from public.room_types;        -- expect 35
-- select count(distinct city) from public.listings; -- expect 6
