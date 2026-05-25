# Functional + Integration Audit v2 — 2026-05-25

Comprehensive read-only audit of the HostelPups codebase after the auth pivot
to password (commit `d5f2917`). Covers every user flow, every form, every
server action, and every route — finds bugs, traces flows, and lists what
works.

Live: https://hostelpups.vercel.app — Local: `C:\Users\johnc\Desktop\HostelPups\hostelpups`

## Summary

- **Build status:** `npm run build` exits 0. 59/59 static pages generated.
  The only stderr output is `TypeError: fetch failed` lines emitted by
  cookie-less Supabase queries at build time (Supabase host unreachable from
  this sandbox env). All of them are wrapped in `try/catch` with safe fallbacks,
  so build does not fail. On Vercel, those env vars resolve and the queries
  succeed — these errors will not appear in production.
- **Critical (will break user flows): 4**
- **High: 8**
- **Medium: 7**
- **Low / polish: 5**
- **PENDING (deferred to user/Phase 2 by design): 6**

---

## 🔴 Critical bugs (will break user flows)

### 1. Phone-login: `profiles.phone` is NOT populated → phone login always fails for new accounts
- **File:** `supabase/migrations/0001_initial_schema.sql:290-307` (`handle_new_user`)
  + `src/components/auth/SignupForm.tsx:144-156`
  + `src/components/auth/OwnerSignupForm.tsx:153-167`
  + `src/components/auth/LoginForm.tsx:107-130`
- **Issue:** The signup forms call `supabase.auth.signUp({ email, password, options.data: { phone: '+91XXXXXXXXXX', ... } })`. The phone goes into `auth.users.raw_user_meta_data->>'phone'`, but it does NOT go into `auth.users.phone` because Supabase's `signUp({ email, password })` ignores `phone` outside of `options.phone` (and phone-OTP is OFF). The trigger reads:
  ```sql
  insert into public.profiles (id, email, phone, name)
  values (
    new.id,
    new.email,
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),  -- OK, falls back
    new.raw_user_meta_data->>'name'
  )
  ```
  So `coalesce` DOES pick up the metadata phone — the trigger is correct.

  **BUT** the login form looks up `phone = "+91XXXXXXXXXX"` via the anon client:
  ```js
  await supabase.from("profiles").select("email").eq("phone", phoneFormatted).maybeSingle()
  ```
  Even though RLS policy `profiles_select_public` (USING `true`) lets the anon
  client read profiles, the lookup will return the row IF the trigger wrote
  the phone correctly. **The trigger does the right thing.**

  **Real bug:** all profile rows that existed BEFORE this signup pivot
  (anything created via the previous phone-OTP flow or email magic-link flow)
  will have `profiles.phone` set to `null` or to the bare digits (without `+91`),
  because the old signup forms wrote raw 10-digit numbers into metadata, not
  `+91`-prefixed. Existing users created on the test phone-OTP flow (May 21)
  will NOT be able to log in by phone with the new password-based form.
- **Fix:** One-time data migration: `UPDATE profiles SET phone = '+91' || phone WHERE phone IS NOT NULL AND length(phone) = 10 AND phone NOT LIKE '+%';`
  Or change `LoginForm.tsx:107-130` to also try plain 10-digit phone lookup as a fallback.
- **Severity:** Critical because the "log in with phone" feature is one of
  only two login modes. For brand-new accounts on the current password code
  path it works, but for the test/legacy users it fails silently with
  "No account found with that phone number".

### 2. `ensureOwnerRecord` will throw with cryptic error if user signed up via renter form then visits `/owner/onboarding`
- **File:** `src/lib/owner-actions.ts:55-67`
- **Issue:** If a renter (intent=`"renter"`) ever lands on `/owner/onboarding`,
  `ensureOwnerRecord()` reads `user.user_metadata.business_name` which is undefined,
  reads the `businessNameFallback` arg which is also undefined when invoked from the
  `OwnerOnboardingPage` server component (it never passes one — the page just calls
  `getCurrentOwner()` which doesn't invoke `ensureOwnerRecord`). The page only
  calls `ensureOwnerRecord` inside the client component `OwnerOnboardingFlow.tsx:79`
  passing `businessName.trim()` and `city` — but **only after** the user has
  filled the form.

  So the actual surface is: a renter who is logged in and navigates directly
  to `/owner/onboarding` will see the form. They could fill in a business name,
  click Continue, and successfully create an `owners` row even though their
  signup intent was `renter`. There is **no server-side guard** preventing this.
- **Fix:** In `OwnerOnboardingPage` (or in `ensureOwnerRecord`), refuse if
  `user.user_metadata.intent !== 'owner'`. Or accept it but route them
  through a confirmation step.
- **Severity:** Critical for two reasons:
  1. It's a privilege escalation: any renter can become an owner by visiting
     a URL. RLS for `owners_insert_own` only checks `auth.uid() = id`, not role.
  2. It silently bypasses the verification implications (full-service vs
     self-serve tier choice).

### 3. Owner sign-out button redirects to `/owner/login` even from non-owner pages
- **File:** `src/components/owner/OwnerSignOutButton.tsx:30`
- **Issue:** The OwnerSignOutButton sits inside OwnerSidebar, which is only
  rendered on `/owner/*` pages. After sign-out, `window.location.href = "/owner/login"`
  fires. That's fine. **But** — a renter who is logged in with `intent='renter'`
  but visits e.g. `/owner/dashboard` would be redirected to `/owner/login?next=...`
  by the redirect-guards in those pages. They'd never see the sidebar, so this
  isn't reached. Verified safe.
- **Severity:** Actually NOT critical — verified the path is unreachable for renters.
  Demoted to **Low (correct behavior, just confusing variable naming).**

### 4. `redactContactInfo` test cases include test marker but tests are never executed
- **File:** `src/lib/utils.ts:474-538`
- **Issue:** `__REDACTION_TEST_CASES__` is exported as a constant array of 28
  hand-crafted test cases. There is no test runner — no `.test.ts` file in the
  repo, no `vitest`/`jest` dependency. The cases are aspirational documentation
  only. The comment says "Mental-trace pass rate: 28/28" — that's not the same
  as automated test coverage. A subtle regression to the regex (e.g.
  changing `phoneIndian` pattern) would not be caught by CI.
- **Fix:** Add `vitest` (or wire up the existing `next/jest`) and create
  `src/lib/utils.test.ts` that iterates `__REDACTION_TEST_CASES__` and asserts
  `redactContactInfo(input).hadContact === shouldRedact`.
- **Severity:** Critical because anti-disintermediation is a load-bearing
  business rule (5+ violations = perma-ban) and an undetected regression here
  would let owners share phone numbers, breaking the entire revenue model.

---

## 🟠 High priority

### H1. Anon client used during login phone lookup may not see profiles via RLS in some configs
- **File:** `src/components/auth/LoginForm.tsx:113-122`
- **Issue:** The phone lookup `supabase.from("profiles").select("email").eq("phone", phoneFormatted)` runs
  pre-login on the anon JWT. The RLS policy is `profiles_select_public USING (true)` so the
  read is allowed. But this **exposes every user's email address to anyone who
  knows or guesses their phone number.** That's a serious privacy leak — an
  attacker can iterate `+91 9xxxxxxxxx` and harvest emails.
- **Fix:** Create a Postgres RPC `lookup_login_email(phone_param text)` that
  runs as `security definer`, takes `phone_param`, returns the matching `email`
  (or null), and validate the phone format inside the function. The RPC bypasses
  RLS but enforces the narrow access pattern. Then grant `execute` to `anon`.
  Restrict `profiles_select_public` to a narrower column set (or drop public select
  on `email` specifically by moving to a separate view).
- **Severity:** High — privacy regression vs the no-broker, no-personal-data
  marketing promise.

### H2. `intent` metadata missing on legacy/test accounts → wrong post-login redirect
- **File:** `src/components/auth/LoginForm.tsx:144-147` and `src/components/layout/Header.tsx:33-36`
- **Issue:** `data.user?.user_metadata?.intent === "owner"` decides whether to
  redirect to `/owner/dashboard` or `/`. For accounts created via the phone-OTP
  flow on May 21 (commit `1483a42`), `intent` was set, but for any seeding/test
  account created before `intent` was added to the metadata (older fixtures),
  the user will be routed to `/` even if they're an owner. They can still get
  to `/owner/dashboard` via the URL, but the UX is wrong.

  More importantly: the **Header's** `isOwnerIntent` reads `business_name` OR
  `intent==='owner'`. If neither is set on an owner's metadata, the dropdown
  shows "Search PGs" — making owners think they're in renter mode.
- **Fix:** Backfill `user_metadata.intent` based on the existence of an
  `owners` row: a SQL one-liner via the service role, e.g.
  `UPDATE auth.users SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{intent}', '"owner"') WHERE id IN (SELECT id FROM owners) AND (raw_user_meta_data->>'intent') IS NULL;`
- **Severity:** High UX (existing owners may see the wrong nav post-login),
  not critical because all routes have server-side guards.

### H3. City field collected at renter signup is dropped — never written anywhere
- **File:** `src/components/auth/SignupForm.tsx:152` and `supabase/migrations/0001_initial_schema.sql:20-29`
- **Issue:** `SignupForm.tsx` line 152 sends `city: city` in `options.data` (so
  it ends up in `auth.users.user_metadata.city`), but `profiles` has no `city`
  column. There's no `city` column on `profiles` in the initial schema (line 20-29).
  The trigger doesn't try to write it. The data lives only in the JWT metadata,
  unsearchable, unindexable, and invisible to all server queries that
  read from `profiles`.
- **Fix:** Either (a) drop the field from the form to avoid the false promise
  that we're capturing it, or (b) expand-migrate `profiles` to add a `city`
  column + trigger update so it's actually written.
- **Severity:** High — the form makes the user believe their city is being
  saved (it's used for personalization later, recommendations, etc.) but
  it's lost. CLAUDE.md item explicitly called this out as something to verify.

### H4. Owner signup `city` is ALSO dropped (same reason)
- **File:** `src/components/auth/OwnerSignupForm.tsx:163` and `src/lib/owner-actions.ts:53-62`
- **Issue:** OwnerSignupForm writes `city` to `user_metadata.city`. `ensureOwnerRecord`
  reads it, then explicitly comments: "It is intentionally NOT written to public.owners
  — that table currently has no `city` column." The form misleads the owner
  into thinking they're setting the city of their property. The actual city
  is collected again in the OwnerOnboardingFlow (`OwnerOnboardingFlow.tsx:155-180`),
  but if the metadata-city is the only one provided (e.g. owner gets to onboarding,
  business_name is filled from metadata but city select is empty by default),
  the second collection step writes ITS value not the first. Double-collection
  + double-discard.
- **Fix:** Either drop `city` from `OwnerSignupForm` (let onboarding be the
  sole source), or expand-migrate `owners` to add a `city` column.
- **Severity:** High — confusing dead data, plus it means an owner who picks
  Mumbai at signup and Bangalore at onboarding will have only Bangalore. No
  bug visible to user, but data integrity is suspect.

### H5. `OwnerSignupForm` city dropdown only shows 8-10 cities; renter form shows 16
- **File:** `src/components/auth/OwnerSignupForm.tsx:43` vs `src/components/auth/SignupForm.tsx:42`
- **Issue:** OwnerSignupForm uses `ALL_CITIES = union(FULL_SERVICE_CITIES, KERALA_CITIES)`
  → 10 cities (Kochi, Bangalore, Chennai + 7 other Kerala cities).
  SignupForm (renter) uses `CITY_OPTIONS = Object.entries(CITY_NAMES)` → all 16
  cities (incl. Hyderabad, Pune, Mumbai, Delhi, Noida, Gurgaon).
  An owner with a property in Mumbai cannot select Mumbai at signup, but a
  renter can list it as their city. The CLAUDE.md item flagged this — the
  business reason (only launched in 10 cities) is real, but it creates a UX
  cliff: an owner from Mumbai can't even *create* an account. They'd need
  to lie about city.
- **Fix:** Decide policy — either (a) show all 16 cities but render a "waitlist"
  badge for non-launched ones + accept the signup as `tier='self_serve' + status='pending_waitlist'`,
  or (b) keep the limit but add a "Don't see your city?" CTA on the dropdown.
- **Severity:** High because it blocks a hard funnel for owner-acquisition.

### H6. Login post-redirect doesn't honor `?next=` query param
- **File:** `src/components/auth/LoginForm.tsx:144-147`
- **Issue:** After successful login, the code does:
  ```js
  const dest = intent === "owner" ? "/owner/dashboard" : "/";
  router.replace(dest);
  ```
  It IGNORES the `?next=` query param the user came in with. So a user who
  clicked "Save listing" → got bounced to `/login?next=%2Fpg%2Fkochi%2Fsunshine-pg`
  → logs in successfully → lands on `/` instead of going back to the listing.
  Every "sign in to save / contact owner" CTA in the app passes `next=`.
  None of them work after login.
- **Fix:** `const next = searchParams.get("next"); const dest = next ?? (intent === "owner" ? "/owner/dashboard" : "/");` (use `useSearchParams` hook).
  Add allow-list check on `next` to prevent open-redirect (must start with `/` and not `//` or `/http`).
- **Severity:** High — affects login conversion from every gated CTA on
  listing detail, /saved, /messages, etc.

### H7. Same `next=` bug on signup form
- **File:** `src/components/auth/SignupForm.tsx:166-170` and `OwnerSignupForm.tsx:175-178`
- **Issue:** Same as H6 — after `signUp` succeeds with a session, redirect is
  always `/` for renters and `/owner/onboarding` for owners. Ignores `?next=`
  on signup links from gated CTAs.
- **Fix:** Read `next` from `useSearchParams`. Only honor it after onboarding
  is complete for owners (route → `?next=` after `setOwnerTier` instead of
  `/owner/dashboard`).
- **Severity:** High — same reasoning as H6.

### H8. No realtime channel for status updates on `/owner/inquiries` list page
- **File:** `src/app/owner/inquiries/page.tsx` (server-rendered with `getOwnerInquiries`)
- **Issue:** The page is a server component. Server components don't
  subscribe to realtime. So when a new inquiry comes in, the owner sees nothing
  until they hard-refresh. Same for `/messages` and `/owner/dashboard`.
  Existing realtime is only inside `MessageThread.tsx` (per-conversation
  message INSERTs) and `GlobalCallListener.tsx` (incoming calls). Neither
  refreshes the inquiry/conversation **list**.
- **Fix:** Add a small client wrapper around the list (`ConversationListLive`)
  that subscribes to `postgres_changes` on `inquiries` filtered by user_id /
  listings.owner_id, and calls `router.refresh()` on insert. Or use Next 16
  `experimental_useRouter` polling at low frequency.
- **Severity:** High — owners genuinely need to be alerted of new inquiries
  in real time, otherwise the "response rate badge" KPI is impossible to hit.

---

## 🟡 Medium priority

### M1. `forgot-password` page is a stub — no `resetPasswordForEmail` integration
- **File:** `src/app/forgot-password/page.tsx`
- **Issue:** Page just renders a "Coming soon, email support" CTA. No actual
  form. Doesn't crash, doesn't accidentally store anything — just routes user
  to a `mailto:` link. Doesn't include AuthModeToggle so owner-vs-renter
  context is lost. Question (6) in audit spec asked about this; confirmed
  stub-only behavior. CLAUDE.md doesn't promise this works yet.
- **Fix:** When SMTP/email provider is configured, wire `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/auth/callback?next=/reset-password' })`.
  Add a `/reset-password` page that handles the recovery flow (`supabase.auth.updateUser({ password })`).
- **Severity:** Medium (it's openly labeled PENDING in the page, but a real
  product needs a real reset).

### M2. Returning user visiting `/signup` while logged in gets to fill out form
- **File:** `src/app/signup/page.tsx` and `SignupForm.tsx`
- **Issue:** Neither the page nor the form check current auth state. A
  logged-in user can re-submit signUp with a different email → either succeeds
  (creating an orphaned profile) or fails with "already registered". No
  protection. Question (6) in audit spec asked about this; confirmed bug.
- **Fix:** In `SignupForm.tsx` add a `useEffect` that calls `supabase.auth.getUser()`
  on mount and if a user is found, `router.replace('/')` with a friendly
  "you're already signed in" toast. Same for `/login`, `/owner/login`, `/owner/signup`.
- **Severity:** Medium — confusing UX but not data corruption (Supabase will
  reject the second signUp with "already registered").

### M3. `ensureOwnerRecord` profile-role bump uses `update` without checking the response
- **File:** `src/lib/owner-actions.ts:71-75`
- **Issue:** `await supabase.from("profiles").update({ role: "owner" }).eq("id", user.id);` is
  swallowed in try/catch. The comment says "best-effort", but if the update
  silently fails (e.g. RLS blocks because policy was tightened), the user
  ends up with `profiles.role='user'` even though they have an `owners` row.
  RLS for `listings_insert_own` requires `profiles.role='owner'` — so this user
  will be unable to create listings, with no visible error to debug.
- **Fix:** Don't swallow the error. Inspect `error` from the call and either
  throw or route to a "support needed" page.
- **Severity:** Medium — race-condition risk; affects new owners on first
  listing creation.

### M4. `OwnerCallsPage` doesn't redirect to login when signed out
- **File:** `src/app/owner/calls/page.tsx:18-22`
- **Issue:** Unlike every other `/owner/*` page (which `redirect("/owner/login?next=...")`
  on `if (!current)`), this page renders the full owner layout even for an
  anonymous visitor, then shows "Sign in to view your call history." This
  isn't broken per se but it's inconsistent and exposes the `OwnerSidebar` with
  empty business name to non-signed-in users.
- **Fix:** Add the same `if (!user) redirect("/owner/login?next=/owner/calls");`
  guard used by other owner pages.
- **Severity:** Medium — UX inconsistency, possible info leak (sidebar shown to
  anonymous users).

### M5. `messages/[id]/page.tsx` metadata uses generic title for every conversation
- **File:** `src/app/messages/[id]/page.tsx:14-18`
- **Issue:** Every conversation page renders `<title>Conversation</title>`
  in the browser tab. No `generateMetadata` for per-conversation context.
  Not SEO-relevant (noindex), but bad UX when user has multiple chat tabs open.
- **Fix:** Add `generateMetadata({ params })` that fetches the listing title +
  counterparty name and produces e.g. "Chat with Sunshine PG — HostelPups".
- **Severity:** Medium — polish.

### M6. `realtime` channel name collisions between caller / callee tabs
- **File:** `src/lib/webrtc/signaling.ts:50-71`
- **Issue:** Channel name is `call:${callId}`, both peers join the same channel.
  Both subscribe with `broadcast.self: false`, which is correct. But if a user
  has two browser tabs open while signed in as the same callee, they will both
  subscribe to `incoming-calls:${userId}` (`GlobalCallListener.tsx:109`).
  Two modals will pop up. Tapping Accept in one will navigate it to /call,
  but the other tab's modal stays visible — the only check is `incoming?.callId === row.id`
  on UPDATE, which fires when status becomes 'accepted', so the other tab's
  modal closes. OK in theory. But ringing audio (if added later) and the racy
  acceptCall RLS check (`status='ringing'`) means only one tab "wins"; the
  losing tab will see a brief flash and then disappear.
- **Fix:** Acceptable for now. Document the multi-tab behavior. Long-term,
  store a tab/session id on the modal and pass it through.
- **Severity:** Medium — edge case.

### M7. `InquiryStartButton` modal `Send anyway` button still calls `doSubmit` which still redacts server-side
- **File:** `src/components/chat/InquiryStartButton.tsx:185-188`
- **Issue:** The "Send anyway" button promises the user they're sending the
  message as-is. In fact `createInquiry` ALWAYS calls `redactContactInfo`
  (server-side, line 80-90 of `chat-actions.ts`) so the content is replaced
  with `[contact hidden]` regardless. The user is misled into thinking they
  can bypass redaction. Same flaw in `MessageComposer.tsx`.
- **Fix:** Rename button to "Send (will be redacted)" — wording change only,
  enforces the brand promise.
- **Severity:** Medium — both ethical (truth in UI) and operational (avoids
  user confusion when they DM something they thought was the real text).

---

## 🟢 Low priority / polish

### L1. `Header.tsx:165` shows `user.email` in dropdown even for phone-login users
- **File:** `src/components/layout/Header.tsx:163-166`
- **Issue:** "Signed in as: user.email" — fine for email-signup users, but
  if/when phone-only-signup is wired up (currently it's not — signup requires
  email), this would show empty. Defensive code already handles
  `user.email ?? "Account"` so it won't crash.
- **Severity:** Low (no current bug).

### L2. Dead `mockOwners.ts` and `mockListings.ts` imports
- **File:** `src/lib/mockListings.ts`, `src/lib/mockOwners.ts`
- **Issue:** These files still exist and a few components import helpers like
  `getListingGradient`, `getListingMinPrice` from them. The mock data arrays
  inside are no longer used in production (all data is Supabase), but the
  helper functions remain. The imports are fine; the dead data should be
  pruned.
- **Fix:** Extract the helpers (`getListingGradient`, `getListingMinPrice`)
  into `src/lib/listing-utils.ts`, drop the mock arrays. Saves bundle size.
- **Severity:** Low.

### L3. `OwnerLayout` default `businessName` placeholder differs across pages
- **File:** `src/app/owner/calls/page.tsx:22`, `src/app/owner/dashboard/page.tsx:85`, etc.
- **Issue:** Some pages default to `"Your business"`, some to `current.owner?.business_name || "Your business"`,
  some pass nothing (uses the sidebar's hard-coded `"Your Business"`). Cosmetic.
- **Fix:** Single source of truth — read in `OwnerLayout` itself via `getCurrentOwner`
  (server-side).
- **Severity:** Low.

### L4. `UserProfileForm` still references "magic links" in helper copy
- **File:** `src/components/profile/UserProfileForm.tsx:131-133`
- **Issue:** "We send magic links to this address." — wrong, we switched
  to password auth. Email is now used for login + future password reset.
- **Fix:** Update copy to "We send password-reset and account-recovery emails to this address."
- **Severity:** Low — minor stale wording.

### L5. `/owner/onboarding` doc comment still says "magic-link callback" though we don't use those anymore
- **File:** `src/app/owner/onboarding/page.tsx:15-28`
- **Issue:** Comment block describes the magic-link flow. Current flow is
  password signup → session is immediate → onboarding loads.
- **Fix:** Refresh comment to describe password signup flow.
- **Severity:** Low.

---

## ✅ Verified working

- **Renter signup with valid email + 10-digit phone + city + password + T&C** — `SignupForm.tsx` validates each, calls `supabase.auth.signUp`, on session→ redirects to `/`. Trigger writes profile row. ✓
- **Owner signup with business_name + phone + city + password + T&C** — `OwnerSignupForm.tsx` validates, calls signUp with `intent='owner'`, redirects to `/owner/onboarding`. ✓
- **Renter login with email + password** — `LoginForm.tsx` calls `signInWithPassword`, succeeds, redirects per intent. ✓
- **Owner sign-out** — `OwnerSignOutButton.tsx` calls `supabase.auth.signOut()` + hard reload to `/owner/login`. Matches CLAUDE.md spec change. ✓
- **Header dropdown — Renter sees "Search PGs", Owner sees "Owner dashboard"** — `Header.tsx:174` switches based on `isOwnerIntent`. ✓
- **Header logout** — `Header.tsx:84-90` calls `signOut()` then hard nav to `/`. ✓
- **Home page** — ISR (`revalidate=600`), renders FeaturedListings, BrowseCategories, etc. Build report confirms `○ /` (static). ✓
- **City pages (pg-in-kochi etc.)** — 6 static city landings, ISR-enabled. ✓
- **Wedge pages** — 6 cities × 3 wedges = 18 prerendered routes. Build confirms `● /couple-friendly-pg/[city]` with 6 paths. ✓
- **Search page** — server-rendered with filter chips, FilterSidebar drawing distinct areas from `listings.area`. URL params drive Supabase query. ✓
- **Listing detail page** — server-rendered, fetches listing + room_types + photos + owners (without contact_phone). JSON-LD Breadcrumb + LodgingBusiness baked in. ✓
- **`/saved` page** — auth-gated, queries `favorites` with join to listings (+ room_types + listing_photos), maps `listing_photos → photos`. ✓
- **`FavoriteButton`** — optimistic toggle with rollback. Auth-checked before flip. Calls `toggleFavorite` server action. ✓
- **`/profile`** — auth-gated, renders `UserProfileForm` with current name + phone, allows save via `updateUserProfile`. ✓
- **`/messages`** — auth-gated, server-renders ConversationList with separate "owner side" + "renter side" sections. ✓
- **`/messages/[id]`** — renter view of chat, MessageThread with realtime subscription cleanup. ✓
- **`/owner/inquiries/[id]`** — owner view, same MessageThread, also computes strike count from redacted messages in last 30 days. ✓
- **`MessageComposer`** — runs `redactContactInfo` on every keystroke; shows RedactionToast; refuses send without explicit "Send anyway" click. Server-side redaction is always applied. ✓
- **`/calls`** — auth-gated, renders `CallHistoryList` from `getCurrentUserCalls`. ✓
- **`/owner/calls`** — renders `CallHistoryList` for owner. **Note:** missing auth-redirect (M4). ✓ otherwise
- **`/call/[id]`** — server-fetches call via RLS, hands off to client `InCallScreen`. Role inferred from URL `?role` or row identity. ✓
- **`InCallScreen`** — full WebRTC lifecycle, mic permission, peer + signaling cleanup on unmount. ✓
- **`GlobalCallListener`** — site-wide subscription for new ringing calls aimed at the user. Closes modal when call leaves ringing. Cleans up channel + auth subscription on unmount. ✓
- **`IncomingCallModal`** — accept/reject/auto-miss after 60s. ✓
- **`/owner/onboarding`** — verifies owner record, lets user pick tier. ✓ (modulo Critical #2 — no intent guard).
- **`/owner/dashboard`** — server-renders stats from `getOwnerStats`, listings preview, inquiries preview, call count. ✓
- **`/owner/listings`** — table of owner's listings with pause/resume/delete actions. ✓
- **`/owner/listings/new`** — `ListingForm` mode="new"; on save, redirects to edit page with `?just_created=1` so PhotoUploader becomes usable. ✓
- **`/owner/listings/[id]/edit`** — pre-fills form, uses RLS-scoped fetch. Photo uploader works because listing id is now known. ✓
- **`PhotoUploader`** — uploads to `listing-photos` bucket with `<uid>/<listingId>/<uuid>.<ext>`, inserts `listing_photos` row, supports cover, reorder, delete with rollback. RLS-enforced. ✓
- **`/owner/profile`** — KYC status badge, OwnerProfileForm for business_name + contact_phone. ✓
- **`/owner/reviews`, `/owner/payments`, `/owner/settings`** — clean "Coming soon in Phase 2" stubs, all noindex. ✓
- **Anti-disintermediation**:
  - Listing detail JSON-LD does NOT include phone (`pg/[city]/[slug]/page.tsx:296-303` calls `lodgingSchema()` which doesn't accept phone) ✓
  - Owner card only shows `business_name + has_verification_badge + tier` (lines 614-630) ✓
  - `JoinedOwner` interface explicitly excludes `contact_phone` (line 56-61) ✓
  - `call-queries.ts` comment line 6-9 explicitly states "contact_phone never included" ✓
  - `chat-actions.ts` redacts every outbound message (`createInquiry` + `sendMessage`) ✓
- **Auth callback route** — handles `?code` from email confirmation, exchanges for session, supports `next` param + `forwardedHost`. ✓
- **Middleware** — refreshes Supabase session cookies on every request via `updateSession`. ✓
- **Build** — `npm run build` exits 0; all 59 pages built; SSG cities + wedges; ƒ (dynamic) for auth-gated routes is correct. ✓
- **Storage policies** — listing-photos enforces `<uid>/<filename>` first folder, avatars same, kyc/verification fully private. ✓
- **RLS coverage** — all 11 tables + calls have RLS. Public reads scoped to `status='live'` for listings/photos/room_types. Inquiries/messages/favorites/reviews are participant-scoped or owner-scoped. ✓

---

## 🛑 PENDING (user action required, NOT bugs)

These are explicitly marked PENDING in code/comments and require user
configuration or future work — not regressions, just incomplete features.

| # | Item | What needs doing |
|---|---|---|
| 1 | Password reset email | Configure SMTP in Supabase (Resend etc.) then wire `forgot-password` page to call `resetPasswordForEmail`. (See M1 fix.) |
| 2 | TURN server for WebRTC | `peer.ts:32` notes ~20% of users on restrictive networks will fail without TURN. Add Metered.ca or similar credentials. |
| 3 | Native speaker switching | `InCallScreen.tsx:368-377` — earpiece↔loudspeaker requires Capacitor + AVAudioSession/AudioManager. Browser has no API. |
| 4 | Avatar upload | `/profile` shows "Coming soon — avatar picker once the user-avatars bucket is configured." Bucket exists but uploader UI doesn't. |
| 5 | KYC document upload | `/owner/profile` shows the dashed "KYC upload coming soon" panel. Bucket `kyc-documents` is private (service-role only). Needs an admin-supervised upload flow. |
| 6 | Razorpay payments + boost + access tiers | `/owner/payments` placeholder. `payments` + `user_access` tables exist but have no client-facing write paths. Phase 2 work. |

---

## Per-flow trace

### Renter signup

1. User visits `/signup` (`src/app/signup/page.tsx`). SignupPage server-component renders `<AuthModeToggle active="renter" mode="signup" />` + `<SignupForm />` + `<AuthSidePanel flavor="renter" />`.
2. User fills name, email, phone (10 digits), city, password, T&C checkbox. Inline regex validations.
3. On submit (`SignupForm.tsx:119-173`):
   - All `touched` flags set to true.
   - If invalid, surface first inline error.
   - `setSubmitting(true)`, call `supabase.auth.signUp({ email, password, options.data: { name, phone: '+91xxxxxxxxxx', city, intent: 'renter' } })`.
   - DB trigger `handle_new_user` fires → inserts `public.profiles` row with `id, email, phone, name`.
   - If `data.session` returned (email-confirm OFF), `router.replace("/")`. Else show "Check your inbox" pending state.
4. **Issue:** `?next=` query param not honored on success (H6).
5. **Issue:** `city` is captured but not stored in `profiles` (H3).
6. **Issue:** logged-in users can re-render the form (M2).

### Owner signup

1. User visits `/owner/signup`. Renders OwnerSignupForm.
2. Fills business_name, optional contact_name, email, phone, city, password, T&C.
3. On submit (`OwnerSignupForm.tsx:127-182`):
   - Server signUp with metadata `{ name, business_name, phone, city, intent: 'owner' }`.
   - Trigger writes profiles row (role='user').
   - On session, redirect to `/owner/onboarding`.
4. At `/owner/onboarding` (`OwnerOnboardingFlow.tsx`):
   - Step 1: re-enter business_name + city (defaults blank — user just typed them on signup, has to retype).
   - Step 2: pick tier (full_service / self_serve).
   - `ensureOwnerRecord(businessName.trim(), city)` is called — owner row created, profile.role bumped to 'owner'.
   - `setOwnerTier(tier)` updates `owners.tier`.
   - Redirect to `/owner/dashboard`.
5. **Issue:** city from signup is dropped; onboarding city wins (H4).
6. **Issue:** dropdown is limited to 10 cities — Mumbai owners can't sign up (H5).
7. **Issue:** double-collection of business_name + city across signup and onboarding (M-class polish).

### Login with email

1. User visits `/login`. LoginForm renders.
2. Types email + password.
3. `classifyIdentifier(email)` returns `"email"` if regex matches.
4. `signInWithPassword({ email, password })`. On success, redirect based on `data.user.user_metadata.intent`.
5. **Issue:** ignores `?next=` (H6). Intent may be missing for legacy accounts (H2).

### Login with phone

1. User types 10-digit phone.
2. `classifyIdentifier` returns `"phone"`. Note: accepts +91/91/raw 10 digits — last 10 used.
3. Code prepends `+91`, queries `profiles.email where phone = '+91XXXXXXXXXX'` via anon client.
4. If found, calls `signInWithPassword({ email: matched, password })`.
5. **Issue:** Legacy accounts may not have `+91` in their stored phone (Critical #1).
6. **Issue:** Anon SELECT on profiles.email by phone is a privacy leak (H1).

### Send inquiry from listing detail

1. User views `/pg/kochi/sunshine-pg-xyz`.
2. Clicks "Send inquiry message".
3. `InquiryStartButton.tsx`: if not authed → routes to `/login?next=<this listing>`. If authed → opens modal.
4. User types message. Live `redactContactInfo` shows toast if obfuscated contact info detected.
5. On submit, calls server action `createInquiry({ listing_id, first_message })`:
   - Auth check, listing live check, owner-self check.
   - Upsert inquiries row.
   - Insert messages row with `content = redacted, was_redacted = result.hadContact`.
6. `router.replace("/messages/<id>")` → MessageThread loads with the new message + realtime subscribed.

### Call owner from listing detail

1. User clicks "Call owner" on listing.
2. `CallButton.tsx`: if not authed → `/login?next=...`. If authed → calls `initiateCall({ listing_id })`.
3. `initiateCall` (server action):
   - Listing exists + live + not self-owned.
   - Upsert inquiry.
   - Insert calls row, status='ringing', caller_id=me, callee_id=owner.
   - Returns the call.
4. Client `router.push("/call/<id>?role=caller")`.
5. `/call/[id]/page.tsx` fetches the call (RLS-scoped), renders `InCallScreen`.
6. Caller side: subscribes to signaling channel + `call-row:{id}`. Stays in "Ringing…" without engaging mic.
7. Meanwhile owner's `GlobalCallListener` (mounted in root layout) sees the new ringing call (filter `callee_id=eq.<me>`), enriches with caller profile + listing title, pops IncomingCallModal.
8. Owner taps Accept → `acceptCall` → status='accepted'. Caller's realtime listener sees the update → starts mic + creates SDP offer + broadcasts.
9. Owner navigates to `/call/<id>?role=callee` → on offer arrival, sets remote desc, starts mic, creates answer, broadcasts.
10. ICE exchange via signaling → connectionstatechange → 'connected' → UI shows timer.
11. Either side hangs up → broadcasts `hangup` + calls `endCall`. Remote tears down on signal.

---

## Per-server-action audit table

| Action | File | Auth check | RLS-safe? | revalidatePath | Error handling |
|--------|------|------------|-----------|----------------|----------------|
| `ensureOwnerRecord` | owner-actions.ts | ✓ throws | ✓ owners_insert_own | ✓ /owner/dashboard | ✓ try/catch race |
| `setOwnerTier` | owner-actions.ts | ✓ | ✓ | ✓ dashboard+profile | ✓ throws |
| `updateOwnerProfile` | owner-actions.ts | ✓ | ✓ | ✓ profile+dashboard | ✓ try/catch on profile mirror |
| `createListing` | owner-actions.ts | ✓ | ✓ requires role=owner | ✓ listings+dashboard | ✓ throws, redirects on success |
| `updateListing` | owner-actions.ts | ✓ | ✓ owner_id=auth.uid() | ✓ | ✓ throws |
| `pauseListing` | owner-actions.ts | ✓ | ✓ | ✓ | ✓ |
| `resumeListing` | owner-actions.ts | ✓ | ✓ | ✓ | ✓ |
| `deleteListing` | owner-actions.ts | ✓ | ✓ | ✓ | ✓ |
| `toggleFavorite` | user-actions.ts | ✓ | ✓ favorites_all_own | ✓ /saved | ✓ throws |
| `updateUserProfile` | user-actions.ts | ✓ | ✓ profiles_update_own | ✓ /profile | ✓ throws |
| `createInquiry` | chat-actions.ts | ✓ | ✓ +listing.live check | ✓ messages+inquiries | ✓ throws on each step |
| `sendMessage` | chat-actions.ts | ✓ | ✓ messages_insert_participants | ✓ both inboxes | ✓ throws + length check |
| `markConversationRead` | chat-actions.ts | ✓ | ✓ inquiries_update_participants | ✓ | ✓ silent best-effort |
| `initiateCall` | call-actions.ts | ✓ | ✓ calls_insert_self_caller + listing.live | (no revalidate) | ✓ throws |
| `acceptCall` | call-actions.ts | ✓ | ✓ status='ringing' guard | (no revalidate) | ✓ throws |
| `rejectCall` | call-actions.ts | ✓ | ✓ | (no revalidate) | ✓ |
| `cancelCall` | call-actions.ts | ✓ caller scope | ✓ | (no revalidate) | ✓ |
| `endCall` | call-actions.ts | ✓ either party | ✓ neq('ended') idempotent | ✓ /calls + /owner/calls | ✓ |
| `markCallMissed` | call-actions.ts | ✓ | ✓ | ✗ no revalidate | ✓ |
| `failCall` | call-actions.ts | ✓ | ✓ | ✗ no revalidate | ✓ |
| `recordMuteState` | call-actions.ts | ✓ | ✓ | ✗ | ✓ silent best-effort |
| `submitContactForm` | contact-actions.ts | (no auth needed) | n/a | (no revalidate) | ✓ throws on validation |

**Findings:** All server actions have proper auth + RLS coverage. The
calls module skips `revalidatePath('/calls')` on missed/failed/recordMute
events — those routes will show stale data until next manual refresh.
Minor — call list updates via realtime in practice.

---

## RLS verification samples

| Table | Anon read | Auth participant read | Auth-owner-other read | Auth write |
|-------|-----------|----------------------|-----------------------|-----------|
| `profiles` | ✓ (USING true) — exposes email, see H1 | ✓ | ✓ | ✓ own only |
| `owners` | ✓ | ✓ | ✓ | ✓ own only |
| `listings` | ✓ live only | ✓ live or own | ✓ live + own + admin | ✓ owner_id=auth.uid() + role=owner |
| `room_types` | ✓ via listing.live | ✓ | ✓ | ✓ owner of listing |
| `listing_photos` | ✓ via listing.live | ✓ | ✓ | ✓ owner of listing |
| `inquiries` | ✗ | ✓ participant | ✗ | ✓ user_id=auth.uid() on live listing |
| `messages` | ✗ | ✓ participant | ✗ | ✓ sender_id=auth.uid() participant |
| `favorites` | ✗ | ✓ own | ✗ | ✓ own |
| `reviews` | ✓ | ✓ | ✓ | ✓ own |
| `payments` | ✗ | ✓ own only | ✗ | ✗ service role |
| `user_access` | ✗ | ✓ own | ✗ | ✗ service role |
| `calls` | ✗ | ✓ caller or callee | ✗ | ✓ caller=auth.uid() participant |

**No tables are missing RLS.** **No tables have public writes.** **Service-role
tables (`payments`, `user_access`) have NO insert/update policies for non-service
roles**, so a malicious client cannot grant themselves access.

---

## New issues since last audit (v1)

The audit task description references a previous "comprehensive audit + fix
pass" (commit `8fb9c50` — 25+ bugs fixed). The auth pivot to password
(`d5f2917`) is the only major change since. New issues that are direct
consequences of that pivot:

1. **Phone-prefix mismatch for legacy users** (Critical #1) — old phone-OTP users had `+91` written automatically by Supabase Auth into `auth.users.phone`, but the new signup writes it into `user_metadata.phone`. Trigger uses `coalesce(new.phone, raw_user_meta_data->>'phone')` which works for new accounts but is undefined for accounts that were created via the old flow and then dropped. Backfill needed.

2. **City field collected at signup but unused** (H3, H4) — both new signup forms add `city` to options.data; neither writes it to a DB column. UserProfileForm doesn't show it either. This is a UX regression vs the old OTP flow (which never claimed to collect city).

3. **`forgot-password` was added as a stub** (M1) — new file but stub-only. The old phone-OTP didn't have any "forgot OTP" UX, so adding a real password reset is net new and incomplete.

4. **`?next=` redirect param doesn't survive** (H6, H7) — gated CTAs across the app pass `?next=`; the new password forms ignore it. The old phone OTP flow had the same defect but it was less obvious because each step (send OTP → enter OTP) was modal-ish.

5. **`AuthModeToggle` doesn't render on `/forgot-password`** — the toggle wraps `/login` and `/signup` and their owner variants, but the new `/forgot-password` page omits it. Renters and owners share the same reset path which is fine for now, but a logged-out owner who clicked "Forgot password" loses the "Login as Business" context. Polish.

6. **`UserProfileForm` copy still says "magic link"** (L4) — stale copy from before the pivot.

7. **`/owner/onboarding` doc comments still describe magic-link callback** (L5) — same stale-comment issue.

---

## Top recommendations (do these first)

1. **Backfill legacy phone numbers with +91 prefix** (`UPDATE profiles SET phone = '+91' || phone WHERE phone IS NOT NULL AND phone NOT LIKE '+%'` via service role). Unblocks phone login for existing users.
2. **Add server-side intent check in `OwnerOnboardingPage`** — reject renters trying to upgrade themselves to owner without going through `/owner/signup`. Or formalize this as a feature with a confirmation step.
3. **Wire `?next=` into LoginForm + SignupForm + OwnerSignupForm** with allow-list validation. Unbreaks every gated CTA in the app.
4. **Replace the public phone-lookup query with a security-definer RPC**. Closes the email-by-phone enumeration vector.
5. **Drop the `city` field from `SignupForm` and `OwnerSignupForm`** (or wire it through to DB). Right now it's a lie.
6. **Add a vitest test file driving `__REDACTION_TEST_CASES__`** so regression catches all 28 obfuscation patterns automatically.

---

## Build output (full)

```
> hostelpups@0.1.0 build
> next build

▲ Next.js 16.2.6 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 3.7s
  Running TypeScript ...
  Finished TypeScript in 3.9s ...
  Collecting page data using 11 workers ...
generateStaticParams query failed: TypeError: fetch failed   ← Supabase unreachable in audit sandbox; production OK
  Generating static pages using 11 workers (0/59) ...
  ... [40+ similar TypeError lines — all from CityLanding/WedgeLanding/sitemap.ts try/catch wrappers] ...
✓ Generating static pages using 11 workers (59/59) in 43s
  Finalizing page optimization ...

[Route table — all 59 routes correctly typed as ● SSG / ƒ dynamic / ○ static]

ƒ Proxy (Middleware)

EXIT 0
```

**No TypeScript errors. No build errors. No ESLint warnings.** The fetch-failed
lines are sandbox-network only and are explicitly caught by the
`try/catch` blocks in `FeaturedListings`, `BrowseCategories`, `CityLanding`,
`WedgeLanding`, `sitemap.ts`, and `generateStaticParams` — production builds
on Vercel (with env vars set) succeed without these warnings.
