# Build + SEO + Integration Audit — 2026-05-24

## Summary
- Build status: **PASS** (compiled in 3.9s; 55 pages generated successfully)
- TypeScript errors: **0**
- ESLint warnings: **0** (lint is not run in `next build` here, but no `next lint`/`eslint` issues surfaced during the build)
- SEO compliance: **30 / 31 pages PASS** (1 minor — listing detail noindex on missing slug is correct, but the 6 `pg-in-*` city pages render dynamic instead of static — see Critical)
- Mistakes Log violations: **0** (no forbidden lucide brand-icon imports, no `FAQ_ITEMS` from `FaqSection`, no `: any` in source — only docstrings)
- Critical: **3**
- High: **5**

## Build report
- Total pages: **42 routes / 55 prerendered files** (city × slug combinations expand SSG output)
- Static (○): **18** — `/_not-found`, `/about`, `/cities`, `/contact`, `/faq`, `/for-owners`, `/how-it-works`, `/login`, `/owner/login`, `/owner/signup`, `/privacy`, `/profile`, `/robots.txt`, `/saved`, `/signup`, `/sitemap.xml`, `/terms`, plus framework-internal
- SSG (●): **1** — `/pg/[city]/[slug]` (generateStaticParams = correct)
- Dynamic (ƒ): **23** — including all 6 `pg-in-*` city pages, all 3 wedge `[city]` routes, `/`, `/search`, `/auth/callback`, owner area, messages, calls
- Build time: **~10s end-to-end** (3.9s compile + 5.4s TS + 0.95s static gen)
- Errors: none
- Warnings: none from the compiler

### Static-vs-dynamic surprises
The build output is correct for the code as written, but the routing intent in `CLAUDE.md` says "all city + wedge + marketing pages should be statically generated for instant Google indexing." Today every city/wedge page runs `await createClient()` (cookie-aware Supabase client) inside `CityLanding` / `WedgeLanding`, which marks them dynamic.

- `/`  — ƒ Dynamic because `<FeaturedListings />` calls `await createClient()` + `await cookies()`.
- `/pg-in-{kochi,bangalore,chennai,trivandrum,calicut,trichur}` — ƒ Dynamic because of `<CityLanding>` server query.
- `/{couple,bachelor,pet}-friendly-pg/[city]` — ƒ Dynamic because of `<WedgeLanding>` server query (plus they don't call `generateStaticParams` consistently — wedge pages do, city pages don't).

This is the biggest deviation from the stated SEO strategy. See Critical #1 for the fix path.

## 🔴 Critical issues

1. **Homepage + 6 city landings + 3 wedge city pages are server-rendered on demand (ƒ), not statically generated (○).**
   - **Why it matters:** CLAUDE.md SEO Standards says "Static generation for all city + wedge + marketing pages — instant Google indexing." Today every request triggers a fresh Supabase fetch + cookies() read, which kills CDN caching, hurts TTFB, and burns Supabase quota for every search-bot crawl.
   - **Cause:** `src/components/marketing/CityLanding.tsx`, `WedgeLanding.tsx`, and `FeaturedListings.tsx` use `createClient()` from `@/lib/supabase/server` which calls `cookies()`. Any route that reads cookies becomes dynamic.
   - **Fix:** Use the anon-key plain client (same pattern as `generateStaticParams` in `src/app/pg/[city]/[slug]/page.tsx` lines 125-148) for the public, RLS-status='live' reads. Wrap these queries in `unstable_cache` or `fetch(..., { next: { revalidate: 600 } })`, or pass the listings as props from a small server-component shell whose data fetch uses the cookie-less client. Then add `export const revalidate = 600` to each page for ISR.

2. **OwnerSidebar "Sign out" is a `<Link>` to `/owner/login` and never calls `supabase.auth.signOut()`.** (`src/components/owner/OwnerSidebar.tsx:96-102`)
   - **Effect:** Clicking Sign Out does nothing — the session cookie remains valid, middleware refreshes it on next request, and the user is bounced right back into the dashboard. Only `Header.tsx` actually signs out properly.
   - **Fix:** Convert to a `<button>` that calls `await supabase.auth.signOut()` then `window.location.href = "/"` (mirroring `Header.tsx:84-90`).

3. **Sitemap excludes listing detail pages — the most-SEO-valuable URLs.** (`src/app/sitemap.ts`)
   - **Effect:** `/pg/[city]/[slug]` listings are SSG-prerendered (good) but the sitemap never tells Google about them. Discovery only happens via internal links from city pages, which slows indexing dramatically.
   - **Fix:** In `sitemap.ts`, fetch all `status='live'` listings via the anon client (same `createClient` pattern from `generateStaticParams`) and append `${SITE.url}/pg/${city}/${slug}` URLs with priority 0.85 and `changeFrequency: "daily"`. Use the same fallback-on-error pattern.

## 🟠 High priority

1. **`owners` table is missing a `city` column but `owner-actions.ts::ensureOwnerRecord` inserts one.** (`src/lib/owner-actions.ts:78-82` vs `supabase/migrations/0001_initial_schema.sql:39-51`)
   - The code does `if (city) insertPayload.city = city` after a comment that references a "later migration on RingIn." That migration doesn't exist for HostelPups. The insert will only fail if `city` is non-empty, but in the owner signup form it almost always is — which would 400 the insert with `column "city" of relation "owners" does not exist`.
   - **Fix:** Either (a) add migration `0005_owners_city.sql` adding `city text` to `public.owners`, or (b) strip the city branch from `owner-actions.ts` until the schema lands. Per Expand-Contract: ship the SQL first.

2. **Robots.txt allows `/owner/onboarding` and `/owner/listings/new` etc to be crawled.** (`src/app/robots.ts`)
   - The Disallow list covers `/owner/dashboard`, `/owner/listings` (plural root), `/owner/inquiries`, `/owner/calls`, `/owner/profile`, `/owner/payments`, `/owner/reviews`, `/owner/settings` — but NOT `/owner/onboarding`, `/owner/listings/[id]/edit`, `/owner/listings/new`, `/owner/inquiries/[id]`, `/call/[id]`. The pages themselves are `noindex: true`, so this is mitigated, but a defense-in-depth Disallow on `/owner/` (entire prefix) and `/call/` keeps polite crawlers out of the dynamic routes.
   - **Fix:** Disallow `/owner/`, `/call/`, `/auth/callback`. Keep `/owner/login` and `/owner/signup` explicitly allowed if you want them crawled (currently they're `noindex` anyway, so cleanest is broad block).

3. **Hardcoded prices in 7 component files instead of `PRICING` constant.** Mistakes Log says "all prices via `PRICING` constant in `src/lib/site.ts`."
   - `src/components/marketing/WedgeLanding.tsx:204` — `Sign Up — ₹99/week unlocks all owners`
   - `src/components/marketing/HowItWorks.tsx:18` — `Unlock contact details for just ₹99/week`
   - `src/components/marketing/PricingSection.tsx:114` — `Single unlock for ₹29`
   - `src/components/marketing/OwnerCTA.tsx:48-49` — `₹1,999 for full-service ... ₹999/year`
   - `src/components/marketing/WedgeFeatures.tsx:58` — `Pay ₹99 for a week`
   - `src/components/marketing/CityLanding.tsx:232` — `Unlock contacts for ₹99/week`
   - `src/components/auth/AuthSidePanel.tsx:19,25` — `Rs 99/week`, `Rs 99/day`
   - `src/components/auth/SignupForm.tsx:159` — `Rs 99 only to contact an owner`
   - `src/components/owner/OwnerOnboardingFlow.tsx:338` — `+Rs 799/year`
   - `src/app/for-owners/page.tsx` — entire `ownerPlans` array hardcodes `₹1,999`, `₹999`, `₹799`, `₹99`, `₹499`, `₹1,499`
   - `src/app/about/page.tsx:41-42` — narrative copy, lower priority
   - `src/app/signup/page.tsx:11`, `src/app/owner/signup/page.tsx:11` — meta descriptions
   - `src/lib/faq.ts:13,14,26,38` — FAQ answers
   - **Fix:** Replace literals with `formatPrice(PRICING.user.week.price)` etc. FAQ + about copy is borderline — natural-language descriptions are acceptable, but `for-owners`/`PricingSection` price chips MUST come from `PRICING` to stay consistent if prices change.

4. **Image alt text on real photos uses bare strings or empty strings.** (`src/components/owner/PhotoUploader.tsx:402` — `alt={p.name}` where name is the file basename; `src/components/call/InCallScreen.tsx:391` — `alt=""` on remote avatar; `src/components/owner/PhotoUploader.tsx` — has `// eslint-disable-next-line @next/next/no-img-element`)
   - These are inside the app shell (not SEO-critical), but for consistency with SEO Standards "alt text describing the actual content," use `alt="Photo of <listing title>"` etc. PhotoUploader's filename is OK as-is for owner-facing UI.

5. **OG image referenced in `buildMetadata` (`/og-default.png`) doesn't exist in the repo.** (`src/lib/site.ts:23` → `ogImage: "/og-default.png"`)
   - **Effect:** Every social share will 404 the preview image. Twitter/LinkedIn/WhatsApp will render a blank card.
   - **Fix:** Add a 1200×630 PNG at `public/og-default.png` (and a `public/logo.png` referenced by `organizationSchema()` in `seo.ts:106`).

## 🟡 Medium / polish

- **`fetch` logging is on:** `next.config.ts` has `logging: { fetches: { fullUrl: false } }`. Fine for dev, slightly noisy in production builds. Optional toggle for prod.
- **Search page has no `loading.tsx`** — falls back to the previous page until SSR completes. Add `src/app/search/loading.tsx` with a skeleton grid for snappier perceived performance.
- **`/profile` and `/saved` are stubs** that show "Sign in" CTA even when the user IS signed in. They should call `getCurrentUser()` and route to a real profile/favorites view.
- **`getOwnerStrikeCount` query uses `inquiries!inner(listings!inner(owner_id))`** which depends on PostgREST relationship hints. If those hints get ambiguous later (after schema migrations), this returns 0 silently. Add an integration test, or switch to an RPC.
- **Manifest:** `public/manifest.webmanifest` is referenced by layout.tsx but I didn't verify it exists or has icons. Verify before launch.
- **`SITE.phone = "+91-XXXXX-XXXXX"`** — placeholder. Will appear in Organization schema if not removed.
- **`/owner/calls` calls `getCurrentUser()` but does NOT redirect when null.** It renders an "Sign in to view" panel. Cleaner UX is to redirect like `/owner/dashboard` does, matching the rest of the owner area.
- **No `unstable_cache`/`revalidate` anywhere.** Every dynamic page hits Supabase on every request. After the Critical-#1 fix, consider adding ISR or short-lived caches to `FeaturedListings`, `CityLanding`, `WedgeLanding`.

## SEO per-page checklist
| Page | buildMetadata | One H1 | Heading hierarchy | Server component | JSON-LD | Status |
|---|---|---|---|---|---|---|
| `/` (home) | ✅ | ✅ (Hero) | ✅ | ✅ | Organization+WebSite (root), FAQPage | **PASS** (dynamic — Critical #1) |
| `/about` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/how-it-works` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/for-owners` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/contact` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/faq` | ✅ | ✅ | ✅ | ✅ | FAQPage | PASS |
| `/privacy` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/terms` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS |
| `/cities` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS |
| `/search` | ✅ | ✅ | ✅ | ✅ | inherits root | PASS (dynamic by necessity) |
| `/pg-in-kochi` | ✅ | ✅ (CityLanding) | ✅ | ✅ | BreadcrumbList | PASS (dynamic — Critical #1) |
| `/pg-in-bangalore` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS (dynamic) |
| `/pg-in-chennai` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS (dynamic) |
| `/pg-in-trivandrum` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS (dynamic) |
| `/pg-in-calicut` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS (dynamic) |
| `/pg-in-trichur` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS (dynamic) |
| `/couple-friendly-pg/[city]` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS (dynamic) |
| `/bachelor-friendly-pg/[city]` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS (dynamic) |
| `/pet-friendly-pg/[city]` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList | PASS (dynamic) |
| `/pg/[city]/[slug]` | ✅ | ✅ | ✅ | ✅ | BreadcrumbList + LodgingBusiness | PASS (SSG ●) |
| `/login` `/signup` `/owner/login` `/owner/signup` | ✅ noindex | n/a (in client) | n/a | wraps client form | inherits root | PASS |
| `/profile` `/saved` `/messages*` `/calls*` `/call/[id]` `/owner/*` | ✅ noindex | ✅ | ✅ | ✅ | none (correct) | PASS |

## Sitemap audit
**Included:** 9 marketing/static URLs + 6 cities × 4 (city + 3 wedges) = **33 URLs.**

**Missing:**
- `/pg/[city]/[slug]` listing detail pages — the most SEO-valuable URLs (see Critical #3)
- Future-launched city URLs need to be added to the `LAUNCHED_CITIES` array

**Correctly excluded:** `/login`, `/signup`, `/owner/*`, `/messages`, `/calls`, `/profile`, `/saved`, `/call/[id]`, `/auth/callback` — all match `noindex` pages.

**Orphaned:** none — every sitemap URL maps to a real route.

## Robots audit
- ✅ Allow `/` root
- ✅ Disallow `/api/`, `/admin/`, `/owner/dashboard`, `/owner/listings`, `/owner/inquiries`, `/owner/calls`, `/owner/profile`, `/owner/payments`, `/owner/reviews`, `/owner/settings`
- ✅ Disallow `/profile`, `/messages`, `/saved`
- ✅ Disallow `/research/`
- ✅ Sitemap and host set
- ⚠ **Missing**: `/owner/onboarding`, `/owner/listings/new`, `/owner/listings/[id]/edit`, `/owner/inquiries/[id]`, `/call/`, `/calls`, `/auth/callback` (mitigated by `noindex` metadata, but defense-in-depth — see High #2)
- ✅ Listing detail (`/pg/[city]/[slug]`) is NOT disallowed (correct — these are public)
- ✅ City and wedge pages are NOT disallowed (correct)

## Structured data audit
- ✅ **Root layout** emits `organizationSchema()` + `websiteSchema()` in `<head>`. (`src/app/layout.tsx:40-51`)
- ✅ **Homepage** emits `faqSchema(FAQ_ITEMS)`. (`src/app/page.tsx:36-43`)
- ✅ **Listing detail** emits `breadcrumbSchema` + `lodgingSchema`. (`src/app/pg/[city]/[slug]/page.tsx:264-290`)
- ✅ **City pages** emit `breadcrumbSchema`. (all 6 `pg-in-*` pages)
- ✅ **Wedge city pages** emit `breadcrumbSchema`. (all 3 `*-friendly-pg/[city]/page.tsx`)
- ✅ **FAQ page** emits `faqSchema`. (`src/app/faq/page.tsx:18-23`)
- ✅ **/cities** emits `breadcrumbSchema`. (`src/app/cities/page.tsx:91-99`)
- ⚠ `organizationSchema()` references `/logo.png` which doesn't exist in `/public` (see High #5).
- ⚠ `organizationSchema()` lists all 5 social URLs but they all point to placeholder accounts (e.g. `https://instagram.com/hostelpups` — confirm accounts exist before launch).

## Mistakes Log violations
- **#1 (lucide brand icons):** 0 violations. Footer uses inline SVGs correctly (`src/components/layout/Footer.tsx:8-37`).
- **#2 (FAQ_ITEMS from FaqSection):** 0 violations. Both `src/app/page.tsx:13` and `src/app/faq/page.tsx:4` import from `@/lib/faq`. ✅
- **#3 (`l.area` instead of nested):** N/A here — `lodgingSchema` input correctly uses `address.area`.
- **#6 (`Rs` vs `₹`):** present in a few `.tsx`/`.ts` files, but per the Mistakes Log this is OK in markdown only; in TSX both render fine. No action needed.

## Coding rules violations
- `"use client"` on a page: **0** ✅
- Server components are async where they fetch data: ✅
- All metadata via buildMetadata: ✅ (no hand-written `<title>` found)
- Hardcoded `Kochi`/`Bangalore`/etc strings instead of `CITY_NAMES`: a few in static `LAUNCHED`/`COMING` arrays in `cities/page.tsx` and Header navlinks — acceptable since they're display labels next to slugs.
- `cn()` used correctly throughout.
- Tailwind 4 CSS-variable syntax: ✅ everywhere I looked.
- `: any` / `as any`: 0 in source (the one match was in a doc comment inside `mockListings.ts`).
- `console.log(error)` without handling: 0 ✅ (server queries use `console.error("...", error.message)` then fall back to `[]`).

## Supabase integration issues
- All public reads correctly filter `status = 'live'`.
- `head: true` used for count queries in `getOwnerStats`, `CityLanding.tsx:49`, `SearchPage` — ✅
- Joins use the correct relation hint syntax `owners:owner_id (...)`, `listings:listing_id (...)` — ✅
- `contact_phone` is correctly NEVER selected in any public listing-detail join (`src/app/pg/[city]/[slug]/page.tsx:218` whitelists only safe owner fields). ✅
- Server actions all do `getUser()` check + throw on null — ✅
- All queries are wrapped in try/catch or check `error` per Expand-Contract — ✅
- One real risk: **`ensureOwnerRecord` writes a non-existent `city` column** (see High #1).
- One nit: `getOwnerStrikeCount` count query relies on nested PostgREST joins (`messages.select("id, inquiries!inner(listings!inner(owner_id))", { count: "exact", head: true })`). This works today but is brittle to schema renames — flagged in Medium.

## RLS verification
Traced each policy in `0002_rls_policies.sql` against the queries:

- **Anonymous user querying messages:** RLS `messages_select_participants` requires the parent inquiry to belong to the user OR the listing's owner — `auth.uid()` is `null` for anon → query returns 0 rows. ✅ Defends.
- **Renter A reading Renter B's inquiry:** `inquiries_select_participants` checks `user_id = auth.uid() OR listing.owner_id = auth.uid()` — A is neither → 0 rows. ✅ Defends.
- **Owner A updating Owner B's listing:** `listings_update_own` requires `owner_id = auth.uid()` — RLS denies. ✅ Defends.
- **Seeded mock listings with status='live':** `listings_select_live_or_own_or_admin` allows anon SELECT when `status='live'`. ✅ Anonymous viewers can browse.
- **Non-owner inserting a listing:** `listings_insert_own` requires `profiles.role='owner'` exists for `auth.uid()`. ✅ Defends.
- **Renter inquiring on their own listing:** Not blocked by RLS (no role check on insert), but `createInquiry` in `chat-actions.ts:56-58` rejects this at the action level. ✅ Defense in depth.
- **Caller calling themselves:** `initiateCall` in `call-actions.ts:41` rejects. RLS `calls_insert_self_caller` would also let it through (the listing's owner_id branch matches), so the app-level check is necessary. ✅
- **Payments / user_access writes:** No anon/authenticated policies → only service_role can write. ✅ Correct.

## Real-time subscription cleanup
| File | `.subscribe()` site | Cleanup | Verdict |
|---|---|---|---|
| `src/components/chat/MessageThread.tsx:88` | inside `useEffect([inquiryId])` | `return () => void supabase.removeChannel(channel)` line 91 | ✅ |
| `src/components/call/GlobalCallListener.tsx:150` | inside `useEffect([userId])` | `return () => supabase.removeChannel(channel).catch(...)` line 153 | ✅ |
| `src/components/call/GlobalCallListener.tsx:51` | `supabase.auth.onAuthStateChange` | `return () => sub.subscription.unsubscribe()` line 58 | ✅ |
| `src/components/layout/Header.tsx:62` | `supabase.auth.onAuthStateChange` | `return () => sub.subscription.unsubscribe()` line 67 | ✅ |
| `src/lib/webrtc/signaling.ts:64` | `channel.subscribe()` | `close()` method calls `removeChannel` line 97; `InCallScreen` calls `signalingRef.current?.close()` in its cleanup | ✅ |
| `src/components/call/InCallScreen.tsx:186` | `signaling.subscribe()` | Cleanup in `useEffect([call.id, role])` calls `signalingRef.current?.close()` (line 275) | ✅ |

**Filter patterns correct in all cases:**
- `filter: "inquiry_id=eq.${inquiryId}"` ✅
- `filter: "callee_id=eq.${userId}"` ✅
- No leaks identified.

**Possible bug:** `GlobalCallListener`'s `incoming?.callId === row?.id` closure on `incoming` is intentionally stale per the comment at line 156. Reasonable but worth a test.

## Security findings
- ✅ Service role key only referenced in `src/lib/supabase/server.ts` (admin variant). No usage in any client-side file.
- ✅ No hardcoded credentials or API keys.
- ✅ No `eval()` calls.
- ✅ `dangerouslySetInnerHTML` is used ONLY for `JSON.stringify(...schema)` JSON-LD payloads from trusted functions — safe.
- ✅ Cookies set via `@supabase/ssr` (handles httpOnly/secure/sameSite per Supabase defaults).
- ✅ `contact_phone` never reaches the public DOM.
- ✅ Auth-callback handler validates `code` and falls back to `/login?error=...` on failure.
- ✅ Middleware matcher excludes static assets correctly.
- ⚠ `next.config.ts` headers: good (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`). Consider adding a `Content-Security-Policy` before public launch — currently none.
- ⚠ Footer's social anchor tags use `target="_blank" rel="noopener noreferrer"` — ✅
- ✅ `redactContactInfo` is correctly invoked in BOTH `createInquiry` and `sendMessage` server actions before the DB insert.

## Env var documentation
`.env.local.example` exists and lists:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `NEXT_PUBLIC_SITE_URL`
- ✅ Razorpay, MSG91, KYC, Resend (future)
- ⚠ Missing: `NEXT_PUBLIC_GA_ID` (mentioned in CLAUDE.md launch checklist)

## PENDING (founder action)
1. **Add `/public/og-default.png`** (1200×630) and `/public/logo.png` for social previews + Organization schema.
2. **Verify all 5 social handles exist** before launch (`@hostelpups` on IG/FB/Twitter/YouTube/LinkedIn).
3. **Replace `SITE.phone` placeholder** (`+91-XXXXX-XXXXX`) with a real number, or remove from `SITE` entirely.
4. **Apply migration to add `owners.city` column** (or remove the optional-city code in `owner-actions.ts`).
5. **Set up real Supabase env vars** in Vercel dashboard for production builds — `generateStaticParams` for `/pg/[city]/[slug]` will silently fall back to empty array if env is unset (line 130 in the listing detail page).
6. **Apple Developer + APNs** for iOS push (mentioned in RingIn CLAUDE; same applies here once Capacitor wrapper is built).
7. **Replace placeholder Privacy/Terms** with lawyer-reviewed copy before launch (notes inline in the page files).
