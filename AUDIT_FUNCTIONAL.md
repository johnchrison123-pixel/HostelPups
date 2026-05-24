# Functional Audit Report — 2026-05-24

Auditor: Claude Code (Opus 4.7, 1M context)
Scope: Comprehensive read-only QA of HostelPups
Build: `npm run build` PASS (Next.js 16.2.6, 55 static pages, 0 TS errors, 0 lint warnings)
Migrations on disk: 4 (initial_schema, rls_policies, storage_setup, calls_schema) — note CLAUDE prompt mentioned 5 but only 4 exist

## Summary

- Build status: PASS
- Critical bugs: 5
- High priority: 12
- Medium: 11
- Low / polish: 8
- PENDING (user-action / Phase-2 stubs): 7

---

## CRITICAL bugs (will break user flows)

### C1. `ensureOwnerRecord` inserts non-existent `city` column → owner signup is broken
- File: `src/lib/owner-actions.ts:55-83`
- Symptom: The owner-onboarding flow (and the magic-link → /owner/dashboard path which calls `ensureOwnerRecord`) attempts to insert `city` into `public.owners`. The `owners` table (`supabase/migrations/0001_initial_schema.sql:39-51`) has NO `city` column. The signup form (`OwnerSignupForm.tsx:148`) requires city, so `city` is always non-empty, so the `if (city) insertPayload.city = city;` guard at line 81 always adds it, and Postgres errors with "column 'city' does not exist on owners". The catch only re-raises.
- Impact: Every new owner is blocked at onboarding. `OwnerOnboardingFlow.tsx:79` surfaces the raw error to the UI.
- Fix: Drop `city` from `insertPayload` (the column was misremembered from RingIn). If city storage is needed for owners, add a separate migration `0005_owners_add_city.sql` with `alter table owners add column city text;` first, then re-enable the insert (expand-contract).

### C2. Listing detail page never renders uploaded photos — gradient placeholder only
- File: `src/app/pg/[city]/[slug]/page.tsx:307-345`
- Symptom: The gallery `<div>` is a static gradient with hard-coded copy "Photo gallery loading in Phase 1 — owner pictures coming soon" (line 343-344). `listing.photos` is queried (line 215) and embedded in JSON-LD (line 282) but never rendered to the page. Owners who upload photos via PhotoUploader see them in the dashboard but not on the public page that renters actually visit.
- Impact: Defeats the whole "self-serve owner uploads photos" flow. KYC photos invisible to renters. SEO open-graph image won't reflect real photos.
- Fix: Replace the gradient placeholder with a `next/image` based gallery (cover photo as hero + thumbnail strip). Fall back to `getListingGradient(listing.id)` only when `listing.photos.length === 0`.

### C3. `ListingPhoto.order` mismatch: TS type says `order`, DB column is `display_order`
- Files: `src/lib/types.ts:90-96` (type), `supabase/migrations/0001_initial_schema.sql:130-137` (DB), `src/app/owner/listings/[id]/edit/page.tsx:52-61` (consumer), `src/components/owner/PhotoUploader.tsx:148-151` (writer)
- Symptom: PhotoUploader writes `display_order` correctly when inserting. But everywhere else reads `p.order` (the TS field name), which is always `undefined` because PostgREST returns the actual column name `display_order`. As a result:
  - `EditListingPage.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))` is a no-op (always 0).
  - `existingPhotos[].order` is always undefined → PhotoUploader's reorder swap targets undefined order values.
- Impact: Photo ordering shown in the editor is non-deterministic; reorder may persist swapped IDs but the visible row order won't update predictably.
- Fix: Rename TS field to `display_order`, or alias in the select: `.select("id, listing_id, url, is_cover, display_order")` and map to `order` on the way in.

### C4. `Owner` TS type has `profile_id` which does not exist in DB
- File: `src/lib/types.ts:66-77`
- Symptom: `Owner.profile_id` declared in types but DB schema (`0001_initial_schema.sql:39-40`) uses `id` as the FK to `profiles(id)`. No code currently reads `profile_id`, but any future code that does will silently get `undefined`.
- Fix: Remove `profile_id` from the type (use `id` only) — DB pattern is "PK = FK to profiles.id".

### C5. `listing.photos` mapped via `order/is_cover` but the joined select uses `display_order`
- File: `src/app/pg/[city]/[slug]/page.tsx:213-217` and similar in dashboard / `owner/listings/page.tsx`
- Symptom: `getCoverUrl` uses `l.photos.find((p) => p.is_cover) ?? l.photos[0]` — `is_cover` does match the column, OK. But the order assumption in `.find/[0]` is then random because we never sort by `display_order` server-side. Owners may see the "wrong" cover when a non-cover photo is index 0.
- Fix: In every `select("..., listing_photos(*)")` chain, change to `select("..., listing_photos(id, url, is_cover, display_order)")` and add `.order("display_order", { foreignTable: "listing_photos" })`. Or do client-side sort using the correct field name everywhere.

---

## HIGH priority issues

### H1. `OwnerSidebar` lists routes that don't exist → 404s on click
- File: `src/components/owner/OwnerSidebar.tsx:28-37`
- Routes referenced: `/owner/reviews`, `/owner/payments`, `/owner/settings` — none have `page.tsx` in `src/app/owner/`. Will 404 with default Next.js error page.
- Fix: Either build stub pages (cheap copy of `saved/page.tsx`) or remove from the nav until built.

### H2. OwnerSidebar "Sign out" link is just `/owner/login` — does not sign out
- File: `src/components/owner/OwnerSidebar.tsx:96-102`
- Symptom: It renders a `<Link href="/owner/login">` instead of calling `supabase.auth.signOut()`. Clicking it keeps the session alive; user lands on /owner/login which immediately redirects them back into the dashboard because they're still authed (no auth gate on /owner/login but Header still shows their profile).
- Fix: Use a client `<button>` that does `await supabase.auth.signOut(); window.location.href = "/"` (same pattern as `Header.tsx:84-90`).

### H3. Calls feature shipped but UI/nav still says "Phase 2"
- Files:
  - `src/components/owner/OwnerSidebar.tsx:32` — `pending: true` on Calls nav item → renders "Phase 2" badge.
  - `src/app/owner/dashboard/page.tsx:151-158` — `StatsCard label="Calls" value="—" caption="Phase 2 feature" placeholder`.
- Symptom: Misleading status indicators when the feature exists at /owner/calls and /calls.
- Fix: Remove the `pending: true`. In dashboard, compute call count via `getCurrentUserCalls()` and render a real number.

### H4. Owner dashboard "Reply" button on inquiry row routes to list, not specific thread
- File: `src/app/owner/dashboard/page.tsx:367-373`
- Symptom: Each inquiry row's Reply button links to `/owner/inquiries` (the list), not `/owner/inquiries/{row.id}`. User must hunt for the conversation again on the next page.
- Fix: `href={`/owner/inquiries/${row.id}`}`.

### H5. `/saved` page is a static stub — heart icon on ListingCard does nothing
- Files:
  - `src/app/saved/page.tsx:13-37` — generic "Sign in" page, never queries `favorites`.
  - `src/components/listings/ListingCard.tsx:254-263` — heart button is `<button aria-label="Save…">` with NO `onClick`, no auth check, no Supabase write.
  - `src/app/pg/[city]/[slug]/page.tsx:326-332` — same on listing detail.
- Symptom: Even a logged-in user clicking the heart sees no feedback; the `favorites` table is never written.
- Fix: Implement a `<FavoriteButton listingId>` client component that calls `supabase.from("favorites").insert/delete` (RLS already supports this — see `favorites_all_own` in `0002_rls_policies.sql:257-261`). Make `/saved` a server component that queries `favorites!inner(listings(*))` for `auth.uid()`.

### H6. `/profile` page is a stub — no real profile view/edit for renters
- File: `src/app/profile/page.tsx:13-37`
- Symptom: Always shows "Sign in to view your profile" even when signed in. There's no profile editor for renters (avatar, name, phone) anywhere in the app.
- Fix: Server-render `getCurrentProfile()`. Add an `OwnerProfileForm`-like editor at minimum for `name`, `phone`, `avatar_url`. Mobile bottom nav has a Profile icon pointing here so the dead-end is visible to all mobile users.

### H7. Google sign-in button is a dead end in LoginForm
- File: `src/components/auth/LoginForm.tsx:180-184`
- Symptom: Big "Continue with Google" button renders an OR divider + button, but `handleGoogleSignIn` only `setError(...)` with "coming soon". Sets user expectation, breaks it.
- Fix: Either wire up Supabase OAuth (Auth → Providers → Google → set callback URL) OR hide the button until configured.

### H8. `/auth/callback` route ignores existing `?next=` when error occurs
- File: `src/app/auth/callback/route.ts:42`
- Symptom: On `exchangeCodeForSession` error, redirects to `/login?error=auth_callback_failed` and silently drops the user's intended destination (the `?next=...` they passed via magic link). After re-login they land on home, not where they wanted to go.
- Fix: Forward `next` in the error redirect: `?error=...&next=${encodeURIComponent(next)}`.

### H9. `auth/callback` does not honour owner-flow `next=/owner/dashboard?onboarding=1`
- File: `src/app/auth/callback/route.ts:20`
- Symptom: `next` is read from `searchParams.get("next") ?? "/"`. OwnerSignupForm sends `next=/owner/dashboard?onboarding=1` but `URL.searchParams.get` extracts only the path segment if the magic-link redirector strips/decodes the `?` inside the encoded query. In practice this works because the value is `encodeURIComponent`'d before being passed to Supabase, then Supabase re-renders the link, but the dashboard never reads `onboarding=1` anywhere — `OwnerDashboardPage` just checks `current.owner` and redirects to `/owner/onboarding`. So the `?onboarding=1` hint is never used. Cosmetic, but indicates dead code.
- Fix: Drop the `?onboarding=1` suffix or actually read it on the dashboard to show a welcome banner.

### H10. CallScreen caller starts microphone BEFORE callee accepts
- File: `src/components/call/InCallScreen.tsx:190-195`
- Symptom: `role === "caller"` path: immediately `peer.start()` → `getUserMedia({ audio })` → requests mic permission and engages the mic, then `peer.createOffer()` and `signaling.send`. If the callee never picks up, the caller's mic is engaged the whole 60s ringing period (and likely a permission prompt fires before they hear ringing).
- Fix: Caller should `createOffer` BEFORE `peer.start()` if possible, OR move mic acquisition to a "tap to enable mic" state. At minimum, only request mic AFTER the callee_answer arrives (mirror what the callee already does).

### H11. `cancelCall` path is keyed off `connState === "ringing"` which the caller may never hit
- File: `src/components/call/InCallScreen.tsx:314-320`
- Symptom: `handleHangup` checks `connState === "ringing"` to call `cancelCall` vs `endCall`. But for callers, `connState` starts at `"initializing"`, becomes `"ringing"` after offer is sent (line 195), then `"connecting"` after callee_answer arrives (line 239), then `"connected"`. If user clicks End during the very brief `initializing` window or after `connecting` but before `connected`, the wrong reason is logged (`endCall` runs instead of `cancelCall`, end_reason='hangup_caller' instead of 'user_cancelled'). Minor reporting issue.
- Fix: Detect cancellation more reliably — e.g. `if (call.status === "ringing" || connState === "ringing" || connState === "initializing")`.

### H12. `InCallScreen` "Speaker" toggle is purely cosmetic on web, but visible labelled "Speaker"
- File: `src/components/call/InCallScreen.tsx:292-301, 434-444`
- Symptom: There IS a "PENDING — needs Capacitor native module" sub-line, but the visible behaviour is misleading — the button flips state but speaker routing doesn't change. Users will think it works.
- Fix: Gate behind `Capacitor.isNativePlatform()` so the button hides on web entirely (matches the RingIn pattern in CLAUDE.md).

---

## MEDIUM priority

### M1. /profile, /saved are static `○` despite needing auth-aware content
- Files: `src/app/profile/page.tsx`, `src/app/saved/page.tsx`
- Symptom: Both are pure server components with no runtime data and no auth check. They prerender as static HTML. This is fine right now BECAUSE they're stubs, but the moment they read auth they'll need to flip to dynamic. Currently they show "Sign in" copy even to logged-in users.
- Fix: When implementing real content (per H5 / H6), add `export const dynamic = "force-dynamic"` or call `await getCurrentUser()`.

### M2. `messages` is generated as ƒ dynamic — fine but no loading.tsx / error.tsx
- Files: `src/app/messages/page.tsx`, `src/app/messages/[id]/page.tsx`, all `/owner/...` pages
- Symptom: No `loading.tsx` or `error.tsx` files anywhere — a slow Supabase query (e.g. cold start) means the user stares at the previous page. An error throws to Next.js default error overlay.
- Fix: Add `loading.tsx` for messages, owner dashboard, and the call page (where the InCallScreen has to fetch the row before rendering).

### M3. `MessageThread` realtime subscription needs RLS-compatible payload — works only because RLS allows participants
- File: `src/components/chat/MessageThread.tsx:68-93`
- Note: `postgres_changes` with `filter: inquiry_id=eq.X` — Supabase only delivers payloads the user is allowed to read via RLS, which is correct here. But there's no explicit reauth on token refresh; long-lived browser tabs could miss events after a Supabase session expires.
- Mitigation: Re-subscribe on `supabase.auth.onAuthStateChange("TOKEN_REFRESHED")`.

### M4. `GlobalCallListener` subscribes only on initial mount, not on auth-state change
- File: `src/components/call/GlobalCallListener.tsx:40-60, 62-158`
- Symptom: The first effect resolves the user once, the second effect runs when `userId` changes. If the user signs out and back in (rare but possible), the second effect re-runs and re-subscribes — OK. But the FIRST `getUser()` resolves before middleware sets cookies on the very first page load after a magic-link return; users may not get the modal until they navigate once. Tracked but accepted.

### M5. `GlobalCallListener` stale-`incoming` closure on UPDATE
- File: `src/components/call/GlobalCallListener.tsx:142-149` + comment at 156-157
- Symptom: The eslint-disable-next-line on the dep array means the close-on-UPDATE branch reads `incoming?.callId` from a stale closure. If the user receives a second incoming call while the first modal is open, the close-on-UPDATE for the OLD call may not fire because `incoming` is stale.
- Fix: Use a `ref` for the current incoming id (e.g. `const incomingIdRef = useRef<string|null>(null)`), update it whenever `setIncoming` is called, and read `incomingIdRef.current` in the UPDATE handler.

### M6. `createListing` builds slug with random suffix → unique constraint impossible to hit, but original slug words may collide visually
- File: `src/lib/owner-actions.ts:198-207`
- Note: The 6-char random suffix prevents (city, slug) collisions. Two owners with the same title in the same area will end up with `sunshine-pg-edappally-a1b2c3` and `sunshine-pg-edappally-z9y8x7` — works. Just noting this means the SEO-friendly slug isn't strictly title+area; URLs include a suffix forever. Acceptable.

### M7. `updateListing` re-deletes + re-inserts room_types, breaking FK to in-flight references
- File: `src/lib/owner-actions.ts:320-342`
- Symptom: `delete from room_types where listing_id=X` then re-insert. There's no transactional wrapper, so a network failure between delete and insert leaves the listing with zero room_types. Renters viewing the page mid-update see "no rooms" briefly.
- Fix: Wrap in a Supabase RPC function (SQL stored procedure) that does both in one statement, or at minimum diff old vs new room_types and only UPDATE/INSERT/DELETE the deltas.

### M8. `updateListing` and `createListing` never refresh public listing page cache
- Files: `src/lib/owner-actions.ts:276-279, 344-347`
- Symptom: They call `revalidatePath("/owner/listings")` and `revalidatePath("/owner/dashboard")` but NEVER `revalidatePath(`/pg/${city}/${slug}`)`. After an owner edits a live listing, the public detail page is still cached (until next ISR or until a renter visits — but the page is server-rendered, so it depends on Next's data cache). Worse: `generateStaticParams` returns a stale list of slugs that doesn't include freshly-created listings until the next build/redeploy.
- Fix: Add `revalidatePath(`/pg/${input.city}/${input.slug}`)` (need the slug saved first in createListing).

### M9. `generateStaticParams` for `/pg/[city]/[slug]` runs at build time only
- File: `src/app/pg/[city]/[slug]/page.tsx:125-148`
- Symptom: As written, only listings that existed at build time are statically generated; new listings work via fallback (Next.js will SSR them) — but the build output shows `●` (SSG) which means anything outside the static set is also a regenerable page. As long as `dynamicParams` isn't `false` (default = `true`), new listings work. Not a bug — just noting.

### M10. Listing detail "Verification in progress — chat available after KYC" lies about chat gating
- File: `src/app/pg/[city]/[slug]/page.tsx:591-595`
- Symptom: Copy claims chat is blocked for non-verified owners, but `InquiryStartButton` does NOT check `is_verified` — it just creates an inquiry on any LIVE listing. RLS also only checks status='live'. Misleading copy.
- Fix: Either actually gate chat on `is_verified`, or rewrite the copy.

### M11. Phone exposure stub on listing detail leaks intent without paywall implementation
- File: `src/app/pg/[city]/[slug]/page.tsx:557-569`
- Symptom: "Unlock contact — ₹99" button routes to `/signup`, not to a Razorpay flow. Even after signup the user never gets a phone number because `owners.contact_phone` is admin-only and never shown.
- Fix: Either rename to "Sign up to chat" (honest), or implement the actual paywall flow. Currently it's a tease.

---

## LOW priority / polish

### L1. ListingForm shows photos as step 2 but warns "save draft first" — UX rough
- Files: `src/components/owner/ListingForm.tsx:547-565`, `src/components/owner/PhotoUploader.tsx:297-308`
- New listings have no `listingId`. PhotoUploader displays an amber "Save your listing as a draft first" banner with no auto-save action. Owners must click Continue × 4 → Save draft, then come back to step 2.
- Fix: Either reorder steps (basics → rooms → save draft → photos → publish), OR add an auto-save-on-continue when transitioning to the photos step.

### L2. `ListingForm.handleSave` swallows the `NEXT_REDIRECT` correctly but UI flickers
- File: `src/components/owner/ListingForm.tsx:319-326`
- Note: This is fine — the redirect is unavoidable; just a UX nit.

### L3. PhotoUploader stores blob: previews but never uses them — only public URLs
- File: `src/components/owner/PhotoUploader.tsx:73-86, 163-172`
- Symptom: The cleanup effect revokes blob URLs, but uploads never set `preview` to a blob URL — they use the Supabase publicUrl directly. The cleanup runs over nothing. Dead code.
- Fix: Either remove the cleanup or actually create blob previews for instant feedback.

### L4. Search page's `safeQ` regex doesn't escape `_` and `%` in `ilike` patterns
- File: `src/app/search/page.tsx:142-150`
- Symptom: `.replace(/[%,]/g, " ")` strips `%` and `,` but leaves underscores. A user searching `_test_` matches anything with single chars around "test". Low risk, no security impact (read-only on live listings).

### L5. `markConversationRead` is exported but never imported
- File: `src/lib/chat-actions.ts:179-197`
- Symptom: Dead code. Reading the chat thread doesn't mark anything; the "Open" badge in /owner/inquiries always stays on for inquiries with replies.

### L6. `OwnerCallsPage` renders `<OwnerLayout>` with no `businessName` prop
- File: `src/app/owner/calls/page.tsx:21-22`
- Symptom: Sidebar header shows the default "Your Business" placeholder instead of the actual owner name.
- Fix: Pull owner via `getCurrentOwner()` and pass to OwnerLayout.

### L7. trichur vs Thrissur spelling
- File: `src/lib/site.ts:46, 60`; `src/app/pg-in-trichur/page.tsx`
- Cosmetic — modern spelling is "Thrissur". Search engines may not associate them. Consider renaming.

### L8. ListingCard renders fake rating "4.{...}" based on listing id
- File: `src/components/listings/ListingCard.tsx:290-296`
- Symptom: Renders a fake star rating for verified listings using `parseInt(l.id.replace(/\D/g, "")) % 9 + 1` — UUIDs may have no digits, returning NaN. The "(new)" suffix is honest about it, but showing a yellow star+number alongside is misleading to users and SEO.
- Fix: Hide the rating until reviews exist (DB has `reviews` table — query average rating per listing).

---

## PENDING (user action / Phase-2 stubs)

These are explicitly deferred per CLAUDE.md, not bugs:

1. **Supabase Auth URL Configuration** — Site URL + redirect allow-list must include https://hostelpups.vercel.app and any local dev URL. If not set, magic-link callback won't resolve.
2. **Google OAuth provider** — Provider config in Supabase Dashboard required to enable the LoginForm Google button.
3. **TURN server** — `src/lib/webrtc/peer.ts:29-34` only has STUN. ~20% of WebRTC connections behind symmetric NAT will fail.
4. **Native speaker routing** — `InCallScreen` speaker toggle requires Capacitor native module for real earpiece↔loudspeaker.
5. **Razorpay payments** — Whole pricing flow (`PRICING` constant in `site.ts`) is unwired. The "Unlock contact ₹99" button just routes to /signup.
6. **KYC document upload** — `OwnerProfilePage` has a "Coming soon" panel for KYC docs.
7. **`/owner/reviews`, `/owner/payments`, `/owner/settings`** — nav links to non-existent pages; either build or remove (H1 above).

---

## Server actions — coverage

| Action | Auth check | RLS-safe | revalidatePath | Error handling | Notes |
|---|---|---|---|---|---|
| `ensureOwnerRecord` | yes (line 38) | inserts as auth.uid() | yes | throws on error, fallback for race | **BROKEN — see C1** |
| `setOwnerTier` | yes (line 110) | self only | yes | throws on error | OK |
| `updateOwnerProfile` | yes | self only | yes | throws on error | mirrors business_name → profiles.name (best-effort) |
| `createListing` | yes | RLS scopes by owner_id | partial — misses public detail page | throws on error; redirects | M8 |
| `updateListing` | yes | RLS scopes by owner_id | partial — misses public detail page | throws on error | M7, M8 |
| `pauseListing/resumeListing/deleteListing` | yes | RLS-safe (.eq owner_id) | yes | throws on error | OK |
| `createInquiry` | yes | RLS-safe; upsert idempotent | yes | throws on error | OK; redaction wired correctly |
| `sendMessage` | yes | RLS-safe | yes (4 paths) | throws on error | OK; redaction always runs |
| `markConversationRead` | yes | RLS-safe; best-effort | yes | swallows errors | L5 dead code |
| `initiateCall` | yes | RLS-safe; creates inquiry too | no (call list pages don't list here) | throws on error | OK |
| `acceptCall/rejectCall/cancelCall/endCall/markCallMissed/failCall/recordMuteState` | yes | RLS + extra .eq guards | only endCall revalidates | throws on error | OK |

---

## Forms — state coverage

| Form | Validation | Loading state | Error state | Success state | Notes |
|---|---|---|---|---|---|
| LoginForm | email shape | spinner on Send | red alert box | step→check_email | OK; H7 Google dead |
| SignupForm | name ≥ 2 + email | spinner | red alert | step→check_email | OK |
| OwnerSignupForm | name + city + email | spinner | red alert | step→check_email | OK |
| OwnerOnboardingFlow (details) | name + city | spinner | red alert | step→plan | downstream throws because of C1 |
| OwnerOnboardingFlow (plan) | tier picked | spinner | red alert | push to dashboard | OK |
| ListingForm (5 step) | basics only (title 3, city, area) | spinner per intent | red alert | success card | room_types/amenities never validated → empty rooms are allowed |
| MessageComposer | trim + 5000 char max | spinner | red alert | textarea cleared | OK; bypassWarning UX clean |
| InquiryStartButton | uses placeholder if blank | spinner | red alert | router.replace | OK |
| OwnerProfileForm | name ≥ 2, phone regex | spinner | red alert + green success | success banner | OK |
| Search form | none (free text) | n/a (full nav) | n/a | full reload | OK |

---

## Routes — render check

| Route | Static/Dynamic | Auth gate | Notes |
|---|---|---|---|
| `/` | ƒ Dynamic | none | fetches Supabase data → dynamic correctly |
| `/login`, `/signup`, `/owner/login`, `/owner/signup` | ○ Static | none | OK |
| `/pg-in-*` | ○ Static | none | 6 city pages, all static, server-fetch listings (M9 same caveat) |
| `/pg/[city]/[slug]` | ● SSG with fallback | none (auth-aware for buttons) | C2 photo gallery bug |
| `/saved` | ○ Static | none | H5 stub |
| `/profile` | ○ Static | none | H6 stub |
| `/messages` | ƒ Dynamic | yes (redirect) | OK |
| `/messages/[id]` | ƒ Dynamic | yes (redirect + role check) | OK; redirects owner to /owner/inquiries/[id] |
| `/owner/dashboard` | ƒ Dynamic | yes (redirect to /owner/login or /owner/onboarding) | C1 blocks the onboarding flow before this works for a new owner |
| `/owner/listings`, `/owner/listings/new`, `/owner/listings/[id]/edit` | ƒ Dynamic | yes | OK |
| `/owner/inquiries`, `/owner/inquiries/[id]` | ƒ Dynamic | yes (renter redirected to /messages/[id]) | OK |
| `/owner/calls`, `/calls` | ƒ Dynamic | yes | L6 owner missing businessName |
| `/owner/onboarding` | ƒ Dynamic | yes | OK; calls C1 path |
| `/owner/profile` | ƒ Dynamic | yes | OK |
| `/call/[id]` | ƒ Dynamic | yes (redirect → notFound if not participant) | OK |
| `/auth/callback` | ƒ Dynamic | n/a | H8 H9 |
| `/owner/reviews`, `/owner/payments`, `/owner/settings` | — | — | **H1 — pages don't exist** |

---

## RLS verification (sample queries)

| Query | RLS path |
|---|---|
| `listings select status='live'` (anon) | `listings_select_live_or_own_or_admin` policy line 84 → public; OK |
| `listings select where id=X` (owner) | same policy, `owner_id = auth.uid()` branch; OK |
| `inquiries upsert (user_id, listing_id)` (renter, listing live) | `inquiries_insert_self_on_live` — OK |
| `messages insert` (participant) | `messages_insert_participants` — OK |
| `calls insert` (caller) | `calls_insert_self_caller` — OK |
| `listing_photos insert` (owner) | `listing_photos_write_own` — OK |
| `storage upload to listing-photos/<uid>/<listingId>/<file>` | `listing_photos_owner_insert` policy verifies first folder segment = auth.uid()::text — OK (PhotoUploader path is `${user.id}/${listingId}/${unique}.${ext}`) |
| `favorites all` (user) | policy exists but **no client code calls it** — H5 |
| `payments` writes | service-role only, no client flow exists yet — Phase 2 PENDING #5 |

---

## Critical-things checklist (from prompt)

| # | Item | Result |
|---|---|---|
| 1 | `owners` lacks `city` but signup collects it | **CRITICAL — see C1 — actually crashes ensureOwnerRecord** |
| 2 | Listing slug uniqueness | OK — random suffix appended (`buildSlug` in owner-actions.ts) |
| 3 | PhotoUploader needs listingId; UX clear? | NO — see L1 — silent until user fails to upload |
| 4 | `generateStaticParams` env access at build | Works — uses anon client. New listings render via fallback (dynamicParams=true default). |
| 5 | /saved favouriting wired? | NO — H5 |
| 6 | /messages renter vs /owner/inquiries owner | YES — both paths exist; cross-redirect implemented in /messages/[id] and /owner/inquiries/[id] |
| 7 | Header logout clears server cookies? | YES — uses signOut + hard reload (cookies cleared by Supabase SDK) |
| 8 | GlobalCallListener subscription leak? | One per `userId` change; cleanup removes channel. Closure leak: M5. |
| 9 | InquiryStartButton login redirect | YES — line 99-110 returns plain `<Button href=/login?next=...>` if not authed |
| 10 | CallButton auth check | YES — line 47-53 checks auth and redirects |
| 11 | Renter accessing /owner/* | YES — every owner page calls `getCurrentOwner()` then `redirect("/owner/login")` if missing. Renter (no owners row) gets `redirect("/owner/onboarding")` — which is a hole: a renter who signs up via /signup and types /owner/dashboard will land on /owner/onboarding. That page then offers them to "create owner record" which is what C1 currently breaks anyway. The check should be `current.profile?.role !== 'owner'` → redirect. |
| 12 | Anti-cheat regex on EVERY send path | YES — only `createInquiry` and `sendMessage` server actions write `messages` rows; both call `redactContactInfo`. RLS does not allow client-side `.from("messages").insert(...)`-bypass on the browser (defenders: messages_insert_participants restricts but cannot enforce redaction — a malicious client could bypass redaction). Recommendation: use a Postgres trigger `before insert on messages` that runs redaction server-side. |
| 13 | Storage upload path format | OK — `${user.id}/${listingId}/${unique}.${ext}` matches policy `auth.uid()::text = (storage.foldername(name))[1]` |
| 14 | WebRTC peer cleanup on navigate-away | YES — InCallScreen.tsx:262-277 cleans up via `peerRef.current?.close()` + signaling close on unmount, guarded by `teardownInFlightRef`. |
| 15 | Realtime subscription cleanup | MessageThread: yes (line 90-92). GlobalCallListener: yes (line 152-154). |

---

## Detailed flow-by-flow report

### Flow A1: Renter signup → first inquiry
- **/signup** form OK (validation, spinner, error path).
- Magic-link sent via Supabase `signInWithOtp` with `data: { name }` — name lands in `raw_user_meta_data` which the `handle_new_user` trigger reads into `profiles.name`. OK.
- `/auth/callback` exchanges code, redirects to `next` (default `/`). H8/H9 cosmetic.
- Profile auto-created via trigger — schema 0001_initial_schema.sql:290-307. OK.
- Browse listings → click "Send inquiry message" on a listing detail.
- **InquiryStartButton modal** opens (auth-checked). User types message, clicks Send.
- `createInquiry` server action runs `redactContactInfo` and upserts inquiry + first message. OK.
- Redirects to `/messages/{inquiry_id}` via `router.replace`. OK.
- Real-time chat works via `MessageThread` postgres_changes subscription. OK.

### Flow A2: Owner signup → list → receive inquiry → chat → call
1. `/owner/signup` — OK (3-field form).
2. Magic link sent with `data: { business_name, city, intent: "owner" }`. OK.
3. `/auth/callback` → `?next=/owner/dashboard?onboarding=1` → dashboard.
4. `OwnerDashboardPage` sees no `current.owner` → redirects to `/owner/onboarding`.
5. `OwnerOnboardingFlow.handleEnsureRecord` calls `ensureOwnerRecord(businessName, city)` → **C1 — INSERT FAILS** because `owners` has no `city` column. User stuck on onboarding with raw "column city does not exist" error.
6. **Everything downstream blocked**: cannot select tier, cannot reach dashboard, cannot create listing, cannot list property.

### Flow A3: Login → save listing → logout
- `/login` magic link → OK.
- Lands on home. Browses listings, taps heart → **H5 nothing happens**, no favorite saved.
- Visits `/saved` → **H5 static stub**, never shows real favorites.
- Logs out via Header dropdown → `supabase.auth.signOut()` + `window.location.href="/"` → OK, clears cookies via middleware refresh.

### Flow A4: Public browsing (logged out)
- `/` home → server-renders Hero, FeaturedListings (from DB), etc. — OK.
- City pages (`/pg-in-*`) → server-render with DB query — OK.
- Wedge pages (`/couple-friendly-pg/[city]`, etc.) → OK.
- Search with filters → OK (PostgREST chained `.eq()` / `.contains` / `.or` — search/page.tsx).
- Listing detail (`/pg/[city]/[slug]`) renders, but **C2 photo gallery is gradient placeholder only**. InquiryStartButton + CallButton prompt login if not authed. OK.

### Flow A5: WebRTC call flow
1. CallButton on listing detail → auth check → redirect /login if not authed, else `initiateCall`. OK.
2. `initiateCall` server action validates listing live + not owner + upserts inquiry + inserts call row in `ringing`. OK.
3. Caller navigates to `/call/{id}?role=caller`.
4. `InCallScreen` requests mic (H10 — too early), creates SDP offer, subscribes to signaling, sends offer.
5. **GlobalCallListener** on callee's session catches INSERT with `callee_id=eq.<me>` → pops IncomingCallModal.
6. Callee clicks Accept → `acceptCall` server action → navigates to `/call/{id}?role=callee`. OK.
7. Subscribes to signaling, receives offer, creates answer, sends back. OK.
8. ICE exchange + connection establishes. STUN-only — TURN PENDING (#3) — ~20% fail.
9. Hangup → `endCall` action → trigger `calls_finalize_duration` computes duration. OK.
10. Speaker toggle is cosmetic on web (H12).

### Flow A6: Anti-disintermediation in chat
1. User types message with phone number in MessageComposer.
2. `redactContactInfo` runs every keystroke (`useMemo`), `RedactionToast` appears.
3. User clicks Send → handler keeps toast visible if `hasContact && !bypassWarning`.
4. User can click "Send anyway" → `bypassWarning=true`, `sendMessage` runs server-side which re-runs `redactContactInfo` → DB stores redacted text + was_redacted=true.
5. Both parties see [contact hidden] via `MessageBubble.wasRedacted` props.
6. Owner strike count surfaces in `/owner/inquiries/[id]` via `getOwnerStrikeCount`. OK.

---

## Quick win recommended ordering

1. **C1** — drop `city` from owner insert (unblocks ALL new owners) — 2-line fix in owner-actions.ts.
2. **H2** — fix sign-out link (replace Link with a sign-out button). 10 minutes.
3. **H1** — add stubs for /owner/reviews, /owner/payments, /owner/settings (or remove from nav). 30 minutes either way.
4. **C2** — render real photos on listing detail. 30 minutes.
5. **H3** — remove the "Phase 2" pending labels from Calls. 5 minutes.
6. **H4** — fix Reply button href. 1 line.
7. **C3 / C5** — pick one source of truth for `display_order`/`order` field name. 15 minutes.
8. **H5 / H6** — implement favorites + profile pages. 2-4 hours.
9. **H7** — wire Google OAuth or hide button. depends on Supabase config.
10. **H10** — defer caller `peer.start()` until callee picks up. 30 minutes.

End of audit.
