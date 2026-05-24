# HostelPups — Supabase Database Setup

This folder holds every SQL file needed to bring a fresh Supabase project
to the state HostelPups needs to run Phase 1 (real listings, real auth,
owner CRUD).

## What's in this folder

| File | What it does | Required? |
|---|---|---|
| `migrations/0001_initial_schema.sql` | Creates all 11 tables + triggers + functions | Yes |
| `migrations/0002_rls_policies.sql` | Enables Row Level Security with sensible defaults | Yes |
| `migrations/0003_storage_setup.sql` | Creates 4 storage buckets + their policies | Yes |
| `seed.sql` | Inserts 8 demo owners + 20 demo listings + 35 room types | Optional but recommended for first deploy |

## Step 1 — Apply the migrations (10 minutes, one-time)

The fastest path is the **Supabase Dashboard SQL Editor** — no CLI install needed.

1. Open https://supabase.com/dashboard
2. Pick your **HostelPups** project
3. Left nav → **SQL Editor**
4. Click **+ New query**
5. Open `migrations/0001_initial_schema.sql` from this folder
6. Copy the entire contents → paste into the editor → click **Run** (bottom right)
   - You should see "Success. No rows returned"
7. Repeat for `migrations/0002_rls_policies.sql`
8. Repeat for `migrations/0003_storage_setup.sql`
9. Repeat for `seed.sql`

Each file is **idempotent** — running it twice won't break anything, it'll just
no-op the second time. So if you mess up, just re-run.

### Or use the Supabase CLI (if you've installed it)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>   # found in the dashboard URL
supabase db push                                  # applies migrations/*.sql in order
# Then for seed:
psql "<your-connection-string>" -f supabase/seed.sql
```

## Step 2 — Verify it worked

In SQL Editor, run these one at a time. The expected count is in the comment:

```sql
select count(*) from public.profiles;                       -- 8
select count(*) from public.owners;                         -- 8
select count(*) from public.listings;                       -- 20
select count(*) from public.room_types;                     -- 35
select distinct city from public.listings;                  -- 6 cities: kochi, bangalore, chennai, trivandrum, calicut, trichur
select count(*) from public.listings where status='live';   -- 20
select id from storage.buckets;                             -- 4 buckets: listing-photos, avatars, kyc-documents, verification-videos
```

If any count is wrong, scroll up in the SQL editor output for the error.

## Step 3 — Storage bucket configuration (5 minutes, manual)

Migration `0003` creates the buckets and access policies, but the per-bucket
file size + allowed MIME types still need to be set in the dashboard:

1. Dashboard → **Storage** → click bucket name → **Configuration** tab
2. Set these per bucket:

| Bucket | Max file size | Allowed MIME types |
|---|---|---|
| `listing-photos` | 5 MB | `image/jpeg, image/png, image/webp` |
| `avatars` | 2 MB | `image/jpeg, image/png, image/webp` |
| `kyc-documents` | 10 MB | `application/pdf, image/jpeg, image/png` |
| `verification-videos` | 50 MB | `video/mp4, video/quicktime` |

3. **CORS**: Public buckets (`listing-photos`, `avatars`) need `*` in the
   allowed origins for the browser to display them on your Vercel-hosted
   front-end. This is the Supabase default. Confirm under bucket → Configuration → CORS.

## Step 4 — Authentication setup (5 minutes)

1. Dashboard → **Authentication** → **Providers**
2. **Email** — enabled by default. Customize:
   - **Confirm email** template under Email Templates → tweak the subject line
     and link wording to reference HostelPups (current default is generic)
3. **Phone** — leave disabled for now (PENDING: MSG91 integration)
4. **Google OAuth** (optional, recommended) — follow https://supabase.com/docs/guides/auth/social-login/auth-google
   - Add `https://hostelpups.vercel.app/auth/callback` and your local dev
     URL `http://localhost:3000/auth/callback` as redirect URLs

## Environment variables — already set by you

Confirm these are in **Vercel → Project Settings → Environment Variables**
(Production + Preview + Development all checked):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://hostelpups.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase Dashboard → Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase Dashboard → Settings → API → `service_role` `secret` **NEVER expose to browser** |

For **local development**, copy these into `.env.local` at the project root
(the file is gitignored, never commit it):

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## What this unlocks

Once all four files are applied + the dashboard config is done, here's what the
Next.js app can now do (in the next code-side phase):

- **Search page** (`/search`) — can list real `listings` from Supabase, filter
  by city, gender_pref, wedge tag, amenity, price range
- **Listing detail** (`/pg/<city>/<slug>`) — can load real listing + room_types
  + (eventually) listing_photos
- **City landings** (`/pg-in-kochi`, etc.) — feed live listings instead of mock
- **Wedge landings** (`/couple-friendly-pg/kochi`, etc.) — same
- **Auth** — email magic link sign-up/sign-in for users and owners
- **Owner dashboard** (next phase) — create/edit/delete own listings, manage
  room_types, upload photos to `listing-photos` bucket
- **Favorites + inquiries + chat** — table-ready, just need UI wiring
- **Payments + access tiers** — schema ready, blocked on Razorpay integration

## Troubleshooting

### "permission denied for schema auth" when running seed.sql

You're running the SQL through a connection that uses the `anon` role
instead of `service_role`. The dashboard SQL Editor uses `service_role`
by default, so just paste-and-run there. If using CLI / psql, make sure
your connection string uses the service-role connection string from
Settings → Database.

### "duplicate key value violates unique constraint" when re-running seed

This shouldn't happen — `seed.sql` uses `on conflict do nothing` / `on conflict
do update` everywhere. If you do see it, you may have manually inserted a
row earlier. Either drop it first or wrap the offending block in a delete.

### "RLS policy" denies SELECT on listings

You're querying as an anonymous user but the listing's `status` is not
`live`. Either:
- Run the query in SQL Editor (uses service_role, bypasses RLS), or
- Sign in as the listing owner, or
- Update the listing's status to `live`

### "auth.users insert fails — relation does not exist"

The Supabase project hasn't fully initialized yet. Wait 30 seconds after
creating a new project and retry.

### Reset everything (DESTRUCTIVE — wipes all data)

Only use this in a freshly-created project or if you're sure:

```sql
-- WARNING: This drops ALL tables, data, and policies in public schema.
drop schema public cascade;
create schema public;
grant usage on schema public to anon, authenticated, service_role;
```

Then re-run all migrations in order.

## Migration philosophy — expand-contract

When adding a new column or table in a future migration:

1. **Expand** — add the new column with a default so old client code still works
2. Ship a release that uses the new column
3. **Contract** (later) — drop old columns / defaults once no client code references them

Never drop or rename a column in the same release that switches client code
to a new column. See [CLAUDE.md](../CLAUDE.md) "Database Migrations" section.

## File-by-file reference

### `0001_initial_schema.sql`
Creates these 11 tables: `profiles`, `owners`, `listings`, `room_types`,
`listing_photos`, `inquiries`, `messages`, `favorites`, `reviews`, `payments`,
`user_access`. All have appropriate CHECK constraints, foreign keys, and
indexes. Three triggers/functions: `set_updated_at`, `handle_new_user`,
`bump_inquiry_on_message`.

### `0002_rls_policies.sql`
Enables RLS on all 11 tables and adds policies. Key rules:
- `listings`: public can read `status='live'`; owners read/write their own
- `payments` + `user_access`: server-side (`service_role`) writes only
- `messages` + `inquiries`: only participants can read/write

### `0003_storage_setup.sql`
Creates four buckets: `listing-photos` (public), `avatars` (public),
`kyc-documents` (private), `verification-videos` (private).
Folder-scoped policies enforce `<auth-uid>/<filename>` path convention.

### `seed.sql`
Inserts 8 stub `auth.users` (no passwords — accounts can't be signed into
without password reset), 8 `profiles`, 8 `owners`, 20 `listings`, 35
`room_types`. All listings are `status='live'` so the public site has
visible data. `listing_photos` is intentionally not seeded — we have no
real photo URLs yet, the client uses `getListingGradient()` placeholders.
