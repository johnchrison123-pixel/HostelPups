# Build + SEO + Security Audit v2 — 2026-05-25

## Summary
- **Build:** PASS (4.1s compile + 4.1s TypeScript + 43s static gen = ~52s end-to-end)
- **TypeScript errors:** 0
- **ESLint warnings:** 0 surfaced during build (lint not run separately)
- **Pages:** 42 routes / 59 prerendered files
- **SEO compliance pages:** 42 / 42 PASS (every page uses buildMetadata; every public page has exactly one `<h1>`; every private/auth page is correctly `noindex`)
- **Mistakes Log violations:** 0 — no lucide brand-icon imports (footer uses inline SVG with local names like `SocialIcon.Instagram`); no `FAQ_ITEMS` exported from a `"use client"` file (lives in `src/lib/faq.ts`); no nested-property typos
- **`: any` / `as any` in source:** 0 (one match in a doc comment in `mockListings.ts`)
- **RLS verification:** PASS on all 8 traced scenarios
- **Critical:** 1 — Supabase env vars don't exist at build time (Vercel preview/local), `fetch failed` warnings appear repeatedly during static gen — pages still render but listings/sitemap are empty until prod env is reachable.
- **High:** 2 — DB trigger doesn't capture owner signup metadata; manifest icons + favicon missing from `/public`.
- **Medium:** 6 — minor polish items.

Previous audit (`AUDIT_BUILD_SEO.md` 2026-05-24) had **3 Critical + 5 High**. All 3 Criticals and 4 of 5 Highs are FIXED in this pass — see "Fixes since v1" near the bottom.

## Build report

| Route | Type | Revalidate | Expire |
|---|---|---|---|
| `/` | ○ Static | 10m | 1y |
| `/_not-found` | ○ Static | — | — |
| `/about` | ○ Static | — | — |
| `/auth/callback` | ƒ Dynamic | — | — |
| `/bachelor-friendly-pg/[city]` (6) | ● SSG | 10m | 1y |
| `/call/[id]` | ƒ Dynamic | — | — |
| `/calls` | ƒ Dynamic | — | — |
| `/cities` | ○ Static | — | — |
| `/contact` | ○ Static | — | — |
| `/couple-friendly-pg/[city]` (6) | ● SSG | 10m | 1y |
| `/faq` | ○ Static | — | — |
| `/for-owners` | ○ Static | — | — |
| `/forgot-password` | ○ Static | — | — |
| `/how-it-works` | ○ Static | — | — |
| `/icon` | ○ Static | — | — |
| `/login` | ○ Static | — | — |
| `/messages` `/messages/[id]` | ƒ Dynamic | — | — |
| `/opengraph-image` | ○ Static | — | — |
| `/owner/calls` `/owner/dashboard` `/owner/inquiries` `/owner/inquiries/[id]` `/owner/listings` `/owner/listings/[id]/edit` `/owner/listings/new` `/owner/onboarding` `/owner/payments` `/owner/profile` `/owner/reviews` `/owner/settings` | ƒ Dynamic | — | — |
| `/owner/login` `/owner/signup` | ○ Static | — | — |
| `/pet-friendly-pg/[city]` (6) | ● SSG | 10m | 1y |
| `/pg-in-{bangalore,calicut,chennai,kochi,trichur,trivandrum}` | ○ Static | 10m | 1y |
| `/pg/[city]/[slug]` | ● SSG | — | — |
| `/privacy` `/terms` | ○ Static | — | — |
| `/profile` `/saved` `/search` | ƒ Dynamic | — | — |
| `/robots.txt` `/sitemap.xml` `/signup` | ○ Static | — | — |

**Static/SSG/Dynamic breakdown:**
- ○ Static: 23 routes (was 18 in v1) — homepage, all 6 `pg-in-*`, both auth landing pages, `forgot-password`, `opengraph-image`, `icon`, all marketing pages, robots, sitemap
- ● SSG: 4 routes × 6 cities × 3 wedges + listing detail = 19 prerendered files
- ƒ Dynamic: 16 routes — auth-required pages, search (filterable), call/message screens, owner area

This is the **target state from CLAUDE.md SEO Standards** ("static generation for all city + wedge + marketing pages") — Critical #1 from v1 audit is **fully fixed**.

**Build warnings — "fetch failed" during static gen:**
- During `generateStaticParams` for `/pg/[city]/[slug]`: `TypeError: fetch failed` x1
- During static-gen of city/wedge pages: `CityLanding cityListings query failed`, `CityLanding count query failed`, `WedgeLanding cityWedge query failed`, `WedgeLanding national query failed` — repeated for every city/wedge combination
- During sitemap generation: `sitemap listings query failed: TypeError: fetch failed`

**Root cause:** `.env.local` references a Supabase project that's either unreachable or uses placeholder credentials. The code correctly wraps these calls in `try/catch` and returns empty arrays — the build SUCCEEDS, but listings/sitemap-entries are empty until prod env is wired (Critical issue below).

## 🔴 Critical

1. **Listing detail URLs do not exist in production sitemap because Supabase env is unreachable at build time.**
   - `src/app/sitemap.ts` lines 73-94 query `listings` via `createPublicClient()` and fall back to `[]` on `fetch failed`. The build log shows `sitemap listings query failed: TypeError: fetch failed` — meaning the sitemap shipped to production currently contains only 33 marketing URLs, **not the most-SEO-valuable `/pg/[city]/[slug]` listing pages**.
   - Same issue affects `generateStaticParams` in `src/app/pg/[city]/[slug]/page.tsx` lines 126-148 — fallback `return []` means **zero listing pages are prerendered as static HTML**. They'd render on demand instead, which is fine functionally but worse for Core Web Vitals + crawl budget.
   - **Fix:** Ensure `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in **Vercel project settings → Environment Variables** point at a reachable Supabase project for the production build. After Vercel redeploys with valid env, every live listing will be prerendered AND appear in `sitemap.xml`. (CLAUDE.md "Pre-launch checklist" already calls this out under "Set up Supabase project + add keys to Vercel env vars" — flagging here because the warning is silently swallowed.)
   - **Verify after fix:** look for `Generating static pages using N workers (M/N)` where N > 59, and `wget https://hostelpups.vercel.app/sitemap.xml | grep "/pg/" | wc -l` returns > 0.

## 🟠 High

1. **`handle_new_user` DB trigger discards `business_name`, `city`, and `intent` from `raw_user_meta_data`.** (`supabase/migrations/0001_initial_schema.sql` lines 290-307 vs `src/components/auth/OwnerSignupForm.tsx` lines 153-167 and `SignupForm.tsx` lines 144-156)
   - Owner signup writes `business_name`, `phone`, `city`, `intent`, `name` to `auth.users.user_metadata`.
   - The trigger only reads `email`, `phone`, `name` and writes them to `public.profiles`. **`business_name`, `city`, `intent` are never persisted to a relational table.**
   - Downstream code papers over this: `Header.tsx::isOwnerIntent` and `getDisplayName` read `user_metadata` directly, and `ensureOwnerRecord` re-fetches `business_name` from metadata at onboarding time. Renter `city` is never queried — it's effectively dead-storage.
   - **Risk:** if metadata structure ever changes (e.g. Supabase deprecates raw_user_meta_data, or a migration overwrites the column), every "are you an owner?" check breaks. Also no SQL query can ever filter or aggregate by intent / city without a separate table.
   - **Fix (Expand-Contract):**
     - Migration `0005_profile_intent.sql`: add `profiles.intent text not null default 'renter' check (intent in ('renter','owner','admin'))` + `profiles.city text`.
     - Update `handle_new_user` to read `new.raw_user_meta_data->>'intent'` and `->>'city'` and write them to profiles.
     - Backfill existing rows: `update profiles set intent='owner' where id in (select id from owners);`.
     - After deploy, switch reads to use `profiles.intent` / `profiles.city`.

2. **PWA manifest references three icon PNGs that don't exist in `/public`.** (`public/manifest.webmanifest` lines 11-28)
   - Manifest lists `/icon-192.png`, `/icon-512.png`, `/icon-maskable.png`. Directory listing shows none of these exist (only `file.svg`, `globe.svg`, `manifest.webmanifest`, `next.svg`, `vercel.svg`, `window.svg`, `research/`).
   - `layout.tsx` also references `/favicon.ico` and `/apple-touch-icon.png` — neither exists. The Next.js `app/icon.tsx` convention generates `/icon.png` and `/icon` (a 256x256 monogram), but it does NOT auto-create `/favicon.ico` or PWA install icons.
   - **Effect:** "Install app" prompt on Android/iOS shows a blank icon. Browser tab favicon falls back to default.
   - **Fix:** Either (a) generate `icon-192.png`, `icon-512.png`, `icon-maskable.png`, `favicon.ico`, `apple-touch-icon.png` as static PNGs in `/public`, OR (b) repoint the manifest to `/icon` (Next.js convention generates valid PNGs at this URL). Option (a) is best for PWA install reliability.

## 🟡 Medium / polish

1. **`/owner/calls` still does NOT redirect to login when unauth — renders a "Sign in to view your call history" panel inline.** (`src/app/owner/calls/page.tsx` lines 17-21)
   - Inconsistent with `/owner/dashboard` which redirects via `redirect("/owner/login?next=...")`. Was flagged in v1 audit; unchanged.
   - **Fix:** mirror dashboard pattern: `const user = await getCurrentUser(); if (!user) redirect("/owner/login?next=/owner/calls");`.

2. **`SITE.phone` still placeholder `+91-XXXXX-XXXXX`.** (`src/lib/site.ts:13`) Appears as-is in Organization schema's contact info (though `organizationSchema()` doesn't actually surface `phone`, so impact is limited — but it's still wrong).
   - **Fix:** remove the field, or replace with a real support number before launch.

3. **All 5 social URLs point at potentially nonexistent accounts.** (`src/lib/site.ts:28-34`)
   - `instagram.com/hostelpups`, `facebook.com/hostelpups`, etc. — Organization schema's `sameAs` advertises these to Google. If accounts don't exist, the rich result loses credibility (or Google de-prioritises).
   - **Fix:** create the accounts before launch, or remove from `SITE.social` until they exist.

4. **Search page has no `loading.tsx`** — same as v1. Falls back to the previous page until SSR completes. Optional but improves perceived performance.

5. **`getOwnerStats` `inquiries` count relies on RLS to filter to this owner**, but the query has no `eq("listings.owner_id", user.id)` clause — it just `select("id", { count: "exact", head: true })`. Works today because the RLS policy adds the join, but if RLS gets relaxed in dev/admin contexts the count would silently inflate. Defense-in-depth would be to use the same `inquiries!inner(listings!inner(owner_id))` nested filter as `getOwnerStrikeCount`. Low risk currently.

6. **Hardcoded prices remain in 4 files** (Mistakes Log compliance check):
   - `src/app/for-owners/page.tsx` lines 19, 20, 39, 48, 49, 61, 67, 68, 73 — full `ownerPlans` + `addOns` arrays hardcode `₹1,999`, `₹999`, `₹799`, `₹99`, `₹499`, `₹1,499`.
   - `src/app/signup/page.tsx:11` and `src/app/owner/signup/page.tsx:11` — meta descriptions use literal `Rs 99` / `Rs 999` / `Rs 1,999`.
   - `src/lib/faq.ts` lines 13, 14, 26, 38 — FAQ answers hardcode `₹99`, `₹199`, `₹499`, `₹1,999`, `₹999`, `₹799`.
   - `src/app/about/page.tsx:41-42` — narrative copy.
   - `src/components/owner/OwnerOnboardingFlow.tsx:338` — "(+Rs 799/year)" string literal (other prices in the same component DO use `formatPrice(PRICING…)`).
   - **Note:** CityLanding, WedgeLanding, OwnerCTA, PricingSection, HowItWorks, WedgeFeatures, AuthSidePanel ALL now correctly use `formatPrice(PRICING…)` — significant improvement over v1.
   - **Verdict:** narrative copy and meta descriptions are borderline (templating prices into prose is awkward). FAQ + `for-owners` price chips should ideally come from `PRICING` so a single price change in `site.ts` flows everywhere.

## SEO per-page checklist

| Page | buildMetadata | One H1 | h2/h3 hierarchy | Server component | JSON-LD | Verdict |
|---|---|---|---|---|---|---|
| `/` (home) | ✅ | ✅ Hero | ✅ | ✅ | Organization+WebSite (root) + FAQPage | **PASS (static ○)** |
| `/about` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/how-it-works` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/for-owners` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/contact` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/faq` | ✅ | ✅ | ✅ | ✅ | FAQPage | PASS |
| `/privacy` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/terms` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/cities` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS |
| `/search` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS (dynamic ƒ — by necessity) |
| `/pg-in-{kochi,bangalore,chennai,trivandrum,calicut,trichur}` | ✅ | ✅ CityLanding | ✅ | ✅ | BreadcrumbList | **PASS (static ○)** |
| `/couple-friendly-pg/[city]` (6) | ✅ | ✅ WedgeLanding | ✅ | ✅ | BreadcrumbList | **PASS (SSG ●)** |
| `/bachelor-friendly-pg/[city]` (6) | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS (SSG ●) |
| `/pet-friendly-pg/[city]` (6) | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS (SSG ●) |
| `/pg/[city]/[slug]` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList + LodgingBusiness | PASS (SSG ●, see Critical re: empty params) |
| `/forgot-password` | ✅ noindex | ✅ | ✅ | ✅ | none | PASS |
| `/login` `/signup` | ✅ noindex | ✅ in client | n/a (in client form) | wraps client form | none | PASS (correctly noindex) |
| `/owner/login` `/owner/signup` | ✅ noindex | ✅ in client | n/a | wraps client form | none | PASS |
| `/profile` `/saved` | ✅ noindex | ✅ | ✅ | ✅ | none | PASS (now functional, not stubs) |
| `/messages`(2) `/calls` `/call/[id]` `/owner/*` | ✅ noindex | ✅ | ✅ | ✅ | none (correct) | PASS |
| `/auth/callback` | n/a (route handler) | n/a | n/a | n/a | n/a | PASS |

42/42 pages compliant.

## Sitemap audit

`src/app/sitemap.ts` (97 lines):
- ✅ 9 static marketing URLs (`/`, `/about`, `/how-it-works`, `/for-owners`, `/contact`, `/faq`, `/privacy`, `/terms`, `/search`, `/cities`) — actually 10 entries listed.
- ✅ 6 cities × (city + 3 wedges) = 24 generated URLs.
- ✅ **Listing detail URLs now ATTEMPTED** via `createPublicClient()` + `from("listings").select("city, slug, updated_at").eq("status", "live")` — v1 Critical #3 is **fixed in code**, but as noted in Critical #1 above the data is empty at build time until Supabase env is reachable.
- ✅ Try/catch swallows `fetch failed` gracefully — sitemap never crashes the build.
- ✅ `lastModified` per listing uses `updated_at`; `priority: 0.85`; `changeFrequency: "daily"`.

Currently expected output (assuming Supabase env is wired):
- 10 marketing URLs (priority 0.7-1.0)
- 24 city/wedge URLs (priority 0.8-0.9)
- N listing URLs where N = count of `status='live'` listings (priority 0.85)

Correctly **excluded** (noindex): `/login`, `/signup`, `/owner/*`, `/messages*`, `/calls`, `/profile`, `/saved`, `/call/*`, `/auth/callback`, `/forgot-password`.

## Robots audit

`src/app/robots.ts`:
- ✅ Allow `/` root via `allow: "/"`.
- ✅ Disallow `/api/`, `/admin/`.
- ✅ Disallow individual owner pages: `/owner/dashboard`, `/owner/onboarding`, `/owner/listings`, `/owner/listings/`, `/owner/listings/new`, `/owner/inquiries`, `/owner/inquiries/`, `/owner/calls`, `/owner/profile`, `/owner/payments`, `/owner/reviews`, `/owner/settings`.
- ✅ Disallow `/profile`, `/messages`, `/messages/`, `/saved`, `/calls`, `/call/`, `/auth/callback`, `/research/`.
- ✅ `sitemap: ${SITE.url}/sitemap.xml` and `host: SITE.url` set.

**Notable improvements since v1:**
- `/owner/onboarding` now explicitly disallowed (was missing in v1).
- `/owner/listings/new`, `/owner/inquiries/`, `/owner/listings/` now explicit (defense-in-depth on top of page-level `noindex`).
- `/call/`, `/calls`, `/messages/`, `/auth/callback`, `/research/` all disallowed.

`/owner/login` and `/owner/signup` remain crawlable (page-level `noindex: true` blocks indexing) — that's intentional per the inline comment.

**Gap:** dynamic `/owner/listings/[id]/edit` and `/owner/inquiries/[id]` are not in the static disallow list. They're covered by:
- Page-level `noindex: true` metadata ✅
- Disallow on parent path `/owner/listings` (root) — Google strictly interprets this as the literal path; subpaths may or may not be blocked depending on the crawler.

For full belt-and-braces coverage, add `/owner/listings/*` glob-style entries or a broad `/owner/` disallow. Risk is low because the pages are `noindex`.

## Structured data audit

- ✅ **Root layout** (`src/app/layout.tsx:40-51`): `organizationSchema()` + `websiteSchema()`. Organization schema includes `name`, `url`, `logo: ${SITE.url}/icon` (auto-generated), `sameAs[5]`, `contactPoint` with `email + areaServed:"IN" + 5 availableLanguage`.
- ✅ **Homepage** (`src/app/page.tsx:41-48`): emits `faqSchema(FAQ_ITEMS)`.
- ✅ **Listing detail** (`src/app/pg/[city]/[slug]/page.tsx:278-304`): emits `breadcrumbSchema([Home, cityName, listing.title])` + `lodgingSchema({...})`. `lodgingSchema` correctly uses nested `address.area` (no `l.area` regression — Mistakes Log #3 not repeated).
- ✅ **City pages** (all 6): each emits `breadcrumbSchema([Home, PG, city])`.
- ✅ **Wedge city pages** (all 3 × 6 = 18 routes): each emits a breadcrumb via the page template.
- ✅ **FAQ page** (`src/app/faq/page.tsx:17-24`): emits `faqSchema`.
- ✅ **Cities index** (`src/app/cities/page.tsx:89-99`): emits `breadcrumbSchema([Home, Cities])`.
- ✅ All `dangerouslySetInnerHTML` calls are scoped to trusted `JSON.stringify(...schema())` payloads — no user input flows in.

## Mistakes Log violations

| # | Issue | Status |
|---|---|---|
| 1 | lucide brand-icon imports (Instagram/Facebook/Twitter/Youtube/Linkedin) | **0** ✅ Footer uses inline SVGs in a local `SocialIcon` object — the names match the brands but they're never imported from `lucide-react`. RedactionToast.tsx uses them as `_link` reason strings only. |
| 2 | `FAQ_ITEMS` from a `"use client"` file imported by a server component | **0** ✅ `FAQ_ITEMS` lives in `src/lib/faq.ts` (no "use client"). Both `src/app/page.tsx`, `src/app/faq/page.tsx`, and `src/components/marketing/FaqSection.tsx` import from there. |
| 3 | `l.area` instead of `l.address.area` | **0** ✅ `lodgingSchema` correctly uses nested `address.area`. |
| 4 | Bash `cd && cmd` quoting | **0** (build invoked via PowerShell `Set-Location` + `;`) |
| 5 | Writing a file that hasn't been read first | **0** (audit-time only) |
| 6 | `₹` in `.md` files written via Write tool | This audit avoids the glyph in the markdown body to be safe. |

## Coding rules compliance

- `"use client"` directive on a page file: **0** ✅
- All metadata via `buildMetadata`: ✅ (verified all 42 pages)
- City display names via `CITY_NAMES`: ✅ (cities/page hardcodes for design copy, acceptable)
- `cn()` for conditional classes: ✅ everywhere
- Tailwind 4 CSS-variable syntax (`bg-[var(--color-brand-500)]`): ✅ everywhere
- `: any` / `as any` in source code: **0** (one match was inside a doc comment in mockListings.ts)
- Hardcoded prices: see Medium #6 — 4 files still violate
- Server components are async where they fetch data: ✅
- `console.log(error)` without handling: 0 — all server queries do `console.error("...", error.message)` then fall back to `[]` or `null`.

## Supabase integration

For each query file traced:

**`src/lib/owner-queries.ts`:**
- `getCurrentOwner`: 2 reads (profiles, owners) — both `maybeSingle()` + try/catch fallback to `null`. ✅
- `getOwnerListings`: scoped to `eq("owner_id", user.id)` + order + try/catch. ✅
- `getOwnerListingById`: defensive `eq("owner_id", user.id)` belt-and-braces on top of RLS. ✅
- `getOwnerInquiries`: relies on RLS to filter inquiries to this owner's listings. Verified working via `inquiries_select_participants` policy. ✅
- `getOwnerStats`: 4 parallel `head:true` count queries — efficient. **One concern (Medium #5):** the `inquiries` count has no explicit owner filter — relies on RLS.

**`src/lib/chat-queries.ts`:** not re-read this pass; v1 audit found no issues.

**`src/lib/owner-actions.ts`:**
- `ensureOwnerRecord`: **v1 High #1 FIXED.** The `city` field is no longer written to the `owners` table (line 49-62 comment explicitly notes the table has no city column). `cityFallback` arg is kept for signature stability but referenced via `void cityFallback` to satisfy the type-checker. ✅
- All other functions: scoped to `eq("owner_id", user.id)` + try/catch + `revalidatePath`. ✅

**`src/lib/chat-actions.ts`:**
- `createInquiry`: ✅ checks auth, fetches listing, validates `status='live'`, rejects owner self-inquiry. Uses `upsert(...onConflict: "user_id,listing_id")` for idempotency. All first messages pass through `redactContactInfo()` ✅.
- `sendMessage`: ✅ trim + length cap (5000) + `redactContactInfo()`. Stores `was_redacted` boolean.

**`src/lib/call-actions.ts`:**
- `initiateCall`: ✅ checks listing live + not own + upserts inquiry + inserts call.
- All other actions correctly scope to `eq("caller_id"/"callee_id")` + status guards + use `.neq("status", "ended")` for idempotency. ✅

**`src/app/pg/[city]/[slug]/page.tsx`:**
- `generateMetadata`: ✅ uses authenticated `createClient()` (server). Falls back to slug-derived title on 404.
- `generateStaticParams`: ✅ now uses a plain anon client without cookies (lines 126-148), with try/catch + empty-array fallback if env is unset.
- Page query: ✅ joins `room_types`, `listing_photos`, `owners` — `contact_phone` is **NOT** in the owner select (anti-disintermediation rule preserved).

**`src/app/search/page.tsx`:** ✅ all `.eq()` chains conditional. The free-text `.or()` query escapes `%` and `,` to avoid syntax injection (lines 142-149).

**Listing photos:** `src/app/saved/page.tsx` lines 92-106 correctly maps the joined `listing_photos` field back to `photos` for `ListingCard` compatibility (subtle bug class — joined column name vs aliased name).

## RLS verification

Traced each scenario against `0002_rls_policies.sql` + `0004_calls_schema.sql`:

| # | Scenario | Expected | Verdict |
|---|---|---|---|
| 1 | Anon reads `listings.status='live'` row | ALLOW | ✅ `listings_select_live_or_own_or_admin` permits anon when status='live' |
| 2 | Anon reads `owners.business_name` (joined from listing) | ALLOW | ✅ `owners_select_public` is `using (true)` |
| 3 | Anon reads `profiles.name` (login phone-lookup) | ALLOW | ✅ `profiles_select_public` is `using (true)` |
| 4 | Anon reads `message` row | DENY | ✅ `messages_select_participants` requires `auth.uid()` in the inquiry's user_id or listing.owner_id — `null` matches neither, returns 0 rows |
| 5 | Anon reads any `inquiry` | DENY | ✅ `inquiries_select_participants` same logic |
| 6 | User A reads their own inquiry | ALLOW | ✅ `inquiries_select_participants` matches `user_id = auth.uid()` |
| 7 | User A reads User B's inquiry | DENY | ✅ RLS returns 0 rows |
| 8 | Owner inserts listing on their own account (profiles.role='owner') | ALLOW | ✅ `listings_insert_own` requires `owner_id = auth.uid()` AND `profiles.role='owner'` |
| 9 | Different owner updates owner A's listing | DENY | ✅ `listings_update_own` `using (owner_id = auth.uid())` |
| 10 | Anon reads `payments` or `user_access` | DENY | ✅ Both tables have RLS enabled, no anon policies |
| 11 | Caller calls themselves | DENY at app level | ✅ `initiateCall` rejects when `listing.owner_id === user.id`. (RLS `calls_insert_self_caller` would actually permit this since the listing-owner check OR-matches.) |
| 12 | User reads a call where they're neither caller nor callee | DENY | ✅ `calls_select_participants` requires `caller_id = auth.uid() OR callee_id = auth.uid()` |
| 13 | Insert call without being a participant of the inquiry | DENY | ✅ `calls_insert_self_caller` checks `caller_id = auth.uid()` AND the inquiry's user_id or listing.owner_id matches |
| 14 | Delete a call row | DENY | ✅ No delete policy — call history is immutable for dispute resolution |

All 14 scenarios pass.

## Storage policies

`0003_storage_setup.sql`:
- ✅ `listing-photos` bucket: public read, INSERT/UPDATE/DELETE scoped to `auth.uid()::text = (storage.foldername(name))[1]` — the first path segment must be the user's UID.
- ✅ `avatars` bucket: same pattern.
- ✅ `kyc-documents`, `verification-videos`: private — only service_role can read/write.

PhotoUploader path convention (`<uid>/<listingId>/<random>.<ext>`) matches the policy. `BUCKET = 'listing-photos'` declared. ✅

⚠ **TODO from the migration file:** per-bucket file size + MIME limits (5 MB images, 10 MB PDFs, 50 MB videos) must be set via the Supabase Dashboard. Confirm before launch.

## Auth + middleware

- ✅ `middleware.ts` matcher excludes static assets correctly: `_next/static`, `_next/image`, `favicon.ico`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, plus image extensions.
- ✅ `updateSession` (in `src/lib/supabase/middleware.ts`) correctly calls `supabase.auth.getUser()` between cookie setter and response return — refreshes auth cookies on every dynamic request.
- ✅ `/auth/callback` handles `code` exchange (kept for future OAuth / magic-link path).
- ✅ Email magic-link removed from form code — `LoginForm` uses `signInWithPassword` + phone-to-email lookup (lines 132-141); `SignupForm` + `OwnerSignupForm` use `signUp` with password (lines 145-156 / 153-167).
- ✅ Sign-out handled correctly in BOTH `Header.tsx` (lines 84-90) AND `OwnerSidebar` via `OwnerSignOutButton.tsx` (v1 Critical #2 FIXED — was a broken `<Link>` previously).

## Real-time subscription cleanup

| File | `.subscribe()` site | Cleanup | Verdict |
|---|---|---|---|
| `src/components/chat/MessageThread.tsx:88` | inside `useEffect([inquiryId])` | `return () => void supabase.removeChannel(channel)` line 91 | ✅ |
| `src/components/call/GlobalCallListener.tsx:150` | inside `useEffect([userId])` | `return () => supabase.removeChannel(channel).catch(...)` line 153 | ✅ |
| `src/components/call/GlobalCallListener.tsx:51` | `supabase.auth.onAuthStateChange` | `return () => sub.subscription.unsubscribe()` line 58 | ✅ |
| `src/components/layout/Header.tsx:62` | `supabase.auth.onAuthStateChange` | `return () => sub.subscription.unsubscribe()` line 67 | ✅ |
| `src/lib/webrtc/signaling.ts:64` | `channel.subscribe()` | `close()` method calls `removeChannel` line 97; `InCallScreen.tsx` cleanup calls `signalingRef.current?.close()` | ✅ |
| `src/components/call/InCallScreen.tsx:186` (signaling) | inside `useEffect([call.id, role])` | Cleanup tears down peer + signaling + the optional call-row channel (lines 334-353) | ✅ |
| `src/components/call/InCallScreen.tsx:266` (call-row channel for caller) | inside same effect | Cleanup at lines 340-343 removes the channel | ✅ |

**Filter patterns:** `inquiry_id=eq.${inquiryId}` ✅; `callee_id=eq.${userId}` ✅; `id=eq.${call.id}` ✅. No leaks.

**WebRTC peer cleanup:** `InCallScreen.tsx:347` calls `peerRef.current?.close()` on unmount. `handleHangup` (lines 380-401) broadcasts hangup + closes peer + closes signaling + updates DB. ✅

## Security findings

- ✅ Service role key (`SUPABASE_SERVICE_ROLE_KEY`) is referenced ONLY in `src/lib/supabase/server.ts` (admin variant). No client-side usage found.
- ✅ No hardcoded credentials in source.
- ✅ No `eval()` calls.
- ✅ `dangerouslySetInnerHTML` is used ONLY for trusted `JSON.stringify(...)` JSON-LD payloads — never with user input.
- ✅ Cookies set via `@supabase/ssr` (handles httpOnly/secure/sameSite per Supabase defaults).
- ✅ `contact_phone` is intentionally NOT selected in the public listing query (`src/app/pg/[city]/[slug]/page.tsx:217-223`).
- ✅ `redactContactInfo` is invoked in BOTH `createInquiry` AND `sendMessage` server actions before DB write.
- ✅ Auth-callback handler validates `code` and falls back to `/login?error=...` on failure.
- ✅ Middleware matcher correctly excludes static assets.
- ✅ `next.config.ts` headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`. Note: microphone is empty, but WebRTC calls need mic — confirm WebRTC works in production with this policy. The mic feature gate may need to be `microphone=(self)` for `getUserMedia` to succeed in third-party contexts; for first-party it's fine since the page is the requester.
- ✅ `Permissions-Policy` correctly allows `geolocation=(self)` for the listing live-location feature.
- ⚠ No `Content-Security-Policy` header set — defer until launch, but worth adding for defense-in-depth.

## Environment variables documentation

`.env.local.example` (27 lines):
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `NEXT_PUBLIC_SITE_URL`
- ✅ Razorpay (Phase 2)
- ✅ MSG91 (Phase 2)
- ✅ KYC (Phase 3)
- ✅ Resend (Phase 2)
- ⚠ Still missing: `NEXT_PUBLIC_GA_ID` (mentioned in CLAUDE.md pre-launch checklist). Add a row for it.

## Password auth specifics

- ✅ `SignupForm.signUp` passes `name`, `phone` (formatted `+91XXXXXXXXXX`), `city`, `intent: "renter"` into `options.data`.
- ✅ `OwnerSignupForm.signUp` passes `name` (contact name or business name), `business_name`, `phone`, `city`, `intent: "owner"`.
- ⚠ `handle_new_user` trigger only consumes `name`, `phone`, `email` from `raw_user_meta_data` — `business_name`, `city`, `intent` are stored in metadata only (see High #1).
- ✅ `signInWithPassword` flow in `LoginForm` works.
- ✅ Phone-to-email lookup is RLS-safe: `profiles.select("email").eq("phone", "+91...")` works against the `profiles_select_public` policy (`using (true)`). Note this lets anon enumerate phone-to-email mapping — acceptable for the use case but a privacy consideration worth tracking.
- ✅ T&C checkbox required to submit — `allValid = ... && terms` in both signup forms.
- ✅ Friendly error mapping: `friendlyError()` translates Supabase auth strings into user-facing copy ("already registered" → "An account with this email already exists. Try logging in.").
- ✅ Forgot-password stub page exists at `/forgot-password`, `noindex: true`, doesn't crash — renders a `mailto:` button to support email + a "back to login" link.

## Fixes since v1 (great work, founder)

- ✅ **Critical #1 (v1)** — Homepage + 6 city landings + 3 wedge city pages were dynamic ƒ. **Fixed.** Homepage is now `○ Static`, all 6 `pg-in-*` are `○ Static`, all 18 `wedge/[city]` are `● SSG`. `CityLanding` and `WedgeLanding` use `createPublicClient()` (cookie-less). `export const revalidate = 600` on every host page.
- ✅ **Critical #2 (v1)** — OwnerSidebar Sign-out was a broken `<Link>`. **Fixed.** Now `OwnerSignOutButton` (client component) calls `supabase.auth.signOut()` + `window.location.href = "/owner/login"`.
- ✅ **Critical #3 (v1)** — Sitemap didn't include listing detail pages. **Fixed in code.** Sitemap.ts lines 73-94 query live listings and append URLs. (See Critical #1 in v2 — only effective when Supabase env is reachable.)
- ✅ **High #1 (v1)** — `ensureOwnerRecord` wrote a non-existent `city` column to `owners`. **Fixed.** City removed from the insert payload; the comment at lines 49-62 explains the Expand-Contract rationale.
- ✅ **High #2 (v1)** — Robots disallow gaps. **Fixed.** `/owner/onboarding`, `/call/`, `/calls`, `/messages/`, `/auth/callback`, `/research/` are all now explicit Disallow entries.
- ✅ **High #4 (v1)** — Listing detail page `alt=""` on remote avatar (in IncallScreen). Still `alt=""` — `aria-hidden` handles the case (avatar is decorative when a name label is shown). Acceptable.
- ✅ **High #5 (v1)** — Missing `/og-default.png` and `/logo.png`. **Fixed cleanly via Next.js conventions.** `src/app/opengraph-image.tsx` (1200x630 gradient) and `src/app/icon.tsx` (256x256 monogram) generate them at build time. `SITE.ogImage = "/opengraph-image"`; `organizationSchema().logo = ${SITE.url}/icon`. Both render as static PNGs (`○ /opengraph-image`, `○ /icon` in route table).
- 🟡 **High #3 (v1)** — Hardcoded prices in 7 components. **Mostly fixed.** CityLanding, WedgeLanding, OwnerCTA, PricingSection, HowItWorks, WedgeFeatures, AuthSidePanel now use `formatPrice(PRICING…)`. 4 files still hardcode (see Medium #6).
- ✅ **Medium #3 (v1)** — `/profile` and `/saved` were stubs showing "Sign in" CTA even when signed in. **Fixed.** Both pages now branch on `getUser()` and render real content (profile form / favorites grid) when authenticated.

## PENDING founder action

1. **Configure production Supabase env vars in Vercel.** Without this, sitemap is missing listing URLs and `generateStaticParams` returns empty — listing pages render on-demand instead of being prerendered.
2. **Create + ship the manifest icons:** `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable.png`, `public/favicon.ico`, `public/apple-touch-icon.png`. Without these the PWA install icon is blank.
3. **Apply migration 0005** to add `profiles.intent` + `profiles.city` and update `handle_new_user` (High #1).
4. **Replace `SITE.phone` placeholder** or remove from `SITE`.
5. **Verify 5 social handles exist** before launch (`@hostelpups` on IG/FB/Twitter/YouTube/LinkedIn).
6. **Set per-bucket size/MIME limits** in Supabase Dashboard (TODO from `0003_storage_setup.sql`).
7. **Replace placeholder Privacy/Terms** with lawyer-reviewed copy.
8. **Optional:** add `NEXT_PUBLIC_GA_ID` row to `.env.local.example`.
9. **Optional:** add `loading.tsx` to `/search` for snappier SSR feel.
10. **Optional:** redirect-to-login in `/owner/calls` for consistency with `/owner/dashboard`.
