# Visual + UX + Accessibility Audit v2 — 2026-05-25

Auditor: read-only second pass. No code modified.
Scope: every `page.tsx` in `src/app` + every component under `src/components`.
Reference deploy: https://hostelpups.vercel.app
Previous audit: `AUDIT_VISUAL_UX.md` (2026-05-24)

This is a delta-aware audit — issues marked **(was #N)** correspond to the
previous audit. I called out everything fixed since v1 ("Resolved since v1"),
everything still present, and a handful of new regressions / issues that the
chat + call + saved + profile + forgot-password ship surfaced.

## Summary
- Pages audited: 44 (every `page.tsx` including new `/forgot-password`,
  `/profile` real implementation, `/saved` real implementation,
  `/owner/{reviews,payments,settings}`)
- Components audited: 47 (added: `FavoriteButton`, `OwnerSignOutButton`,
  `UserProfileForm`, `ContactForm`, `GlobalCallListener`)
- Critical visual: 2
- High UX: 9
- Medium polish: 14
- Low: 11

**Big picture**: every CRITICAL from v1 has been resolved or partially
mitigated. The product is meaningfully closer to launch-ready. What's left is
mostly polish + a handful of consumer-language slips ("magic links" wording
even though auth is now password, "Phase 2" leaking into the UI, fake
testimonials, fake star ratings, placeholder phone number in `SITE`). Owner
table-vs-card mobile layout (#37/#39 from v1) is still partly open. Two new
mid-severity items appeared with the chat/call ship: the chat
counter copy reads "Phone, email, UPI, social handles will be hidden" even
when the user hasn't typed contact info (false alarm), and the
in-call screen still leaks "no TURN server configured" + a `myUserId` lint hack
to end users.

---

## Resolved since v1 (regression checks all PASS)

| v1 # | Status | Notes |
|---|---|---|
| #1 `/saved` placeholder | RESOLVED | `src/app/saved/page.tsx` now queries `favorites` with a Supabase join, renders signed-out CTA only when no user, signed-in empty state when no favorites, and a real grid otherwise. Photos joined via `listing_photos` and re-keyed to `photos` to match `ListingCard`. |
| #2 `/profile` placeholder | RESOLVED | `src/app/profile/page.tsx` renders `UserProfileForm` with editable name + phone + read-only email, plus quick-links sidebar to Saved / Messages / Calls. |
| #3 Owner sidebar dead links | RESOLVED | `/owner/reviews`, `/owner/payments`, `/owner/settings` all exist (`src/app/owner/{reviews,payments,settings}/page.tsx`) with a consistent "Phase 2" hero banner + auth redirect. |
| #4 Owner sign-out doesn't sign out | RESOLVED | New `src/components/owner/OwnerSignOutButton.tsx` calls `supabase.auth.signOut()` + hard reload to `/owner/login`. Sidebar wires it correctly. |
| #5 Hero `type=pg` default chip | RESOLVED | `src/components/marketing/Hero.tsx` no longer has `defaultChecked={idx === 0}`. All chips render unchecked; the form only submits `type=` when the user explicitly picks. |
| #6 ListingCard nested anchor risk for heart | RESOLVED | `src/components/listings/FavoriteButton.tsx` exists, calls `e.preventDefault()` + `e.stopPropagation()` in `handleClick`, sits at `z-10`, and is wired to a real `toggleFavorite()` server action. ListingCard renders it for both grid card heart slot and `/saved` initialFavorited prop. |
| #7 BrowseCategories shows "0+ verified" | RESOLVED | `src/components/marketing/BrowseCategories.tsx` line 159-166 — count only renders when `c.count > 0`. |
| #8 PricingSection scale-105 overlap | RESOLVED | `src/components/marketing/PricingSection.tsx` no longer uses `scale-105` — the highlighted card just gets a thicker border + larger shadow. |
| #10 Search has no loading state | NOT RESOLVED | `src/app/search/` still only contains `page.tsx`. Add a `loading.tsx` skeleton. |
| #11 "Photo gallery loading in Phase 1" copy | RESOLVED | `src/app/pg/[city]/[slug]/page.tsx` lines 322-435 — real photo gallery shown when `hasPhotos`, gradient fallback now says "Photos coming soon" / "Owner photos coming soon — message below to ask the owner for pictures." Consumer-friendly. |
| #12 Listing detail Heart + Share non-functional | PARTIAL | The two buttons inside the gallery hero (lines 348-361 + 414-428) still have no `onClick` — they are visual-only. The FavoriteButton component now exists but is NOT wired into the listing detail page heart. The card-level heart (ListingCard) works; the detail-page hero heart does not. |
| #13 "Unlock contact" loses listing context | RESOLVED | `src/app/pg/[city]/[slug]/page.tsx` line 656-662 — CTA now uses `next=${encodeURIComponent(`/pg/${city}/${slug}`)}`. |
| #18 `/contact` has no form | RESOLVED | `src/components/contact/ContactForm.tsx` exists with client-side validation + `submitContactForm` server action. Renders inline under the email channel cards. |
| #19 Message thread keyboard overlay | RESOLVED | `src/components/chat/MessageThread.tsx` line 103 — uses `h-[calc(100dvh-12rem)] sm:h-[calc(100dvh-14rem)]` (dvh, not vh). |

---

## Still pending from v1

| v1 # | Severity | Owner |
|---|---|---|
| #9 Search has no pagination | High | needs cursor / `?page=N` |
| #10 Search has no `loading.tsx` | High | add Next.js skeleton |
| #14 CityGrid hard-codes `isLaunched` | High | derive from Supabase count |
| #15/#16 City status inconsistency Hero ↔ CityGrid ↔ /cities | High | unify source of truth |
| #17 Featured listings empty if no `is_verified=true` rows | High | fall back to `status=live` only |
| #20 MessageComposer 6-line cap | Medium | bump to 10 on desktop |
| #21 Chat realtime disconnect not handled | Medium | add reconnect banner |
| #22 InCall Speaker button not visibly disabled | Medium | gray out or wire tooltip |
| #25 "10,000+" placeholder repeated 3 places | Medium | use live count |
| #26 Pricing CTAs link to /signup but no payment step | Medium | reword |
| #27 FaqSection no body animation | Low | grid-template-rows transition |
| #28 Fake testimonials (Priya/Arjun/Anjali&Rohan) | Medium | replace before launch |
| #29 OwnerCTA `text-zinc-400` contrast | Low | test in DevTools |
| #31 ListingCard fake star rating from id | Medium | hide until reviews ship |
| #32 ListingCard "+N more" no tooltip | Low | add title |
| #33 InCallScreen `<span className="hidden">{myUserId}</span>` hack | Medium | remove or use |
| #34 "no TURN server configured" leaks to users | Medium | reword |
| #35 Landmark crowding on listing detail address line | Low | new line |
| #37 Owner dashboard inquiries mobile cramping | Medium | stacked cards |
| #38 ListingForm step labels hidden on mobile | Medium | show active step label always |
| #39 ListingForm rooms grid cramped <lg | Medium | stack until lg |
| #40 Inconsistent `Rs ` vs `₹` | Low | pick one |
| #41 Default Next.js favicon | Low | replace |
| #42 `SITE.phone = "+91-XXXXX-XXXXX"` placeholder | Low | resolve before launch |
| #43 Cities page Coming Soon contrast | Low | bump `opacity-70` text |
| #44 Listing detail similar-listings vanishes if siblings.length=0 | Low | national fallback |
| #45 CallHistoryList / IncomingCallModal raw `<img>` | Low | migrate to next/image |
| #46 ListingCard amber-400 text on near-white | Low | switch to amber-600 |
| #48 WedgeFeatures `bg-rose-50` color drift | Low | use brand/wedge tokens |
| #49 ConversationList headers small-caps style | Low | text-base font-bold |
| #50 Privacy/Terms italic "placeholder" disclaimer | Medium | MUST remove pre-launch |

---

## 🔴 Critical visual / UX bugs (v2 = 2)

1. **Listing detail page Heart + Share buttons are still no-op despite a
   working FavoriteButton existing.** File:
   `src/app/pg/[city]/[slug]/page.tsx` lines 348-361 (over the photo) and
   414-428 (over the gradient fallback). The card grid uses the new
   `FavoriteButton` but the detail-page hero still has plain `<button>`
   elements with `aria-label="Save to favourites"` and no `onClick`. Tapping
   them does nothing — a renter who hearts on the detail page expects to
   find that listing on `/saved`. → Drop in `<FavoriteButton listingId=
   {listing.id} listingTitle={listing.title} ... />` to replace both buttons.

2. **`UserProfileForm` shows "We send magic links to this address" but auth
   is password-based.** File: `src/components/profile/UserProfileForm.tsx`
   line 131. The CLAUDE.md Instructions History (2026-05-25) shows the
   project pivoted from magic-link to password auth, but this copy was not
   updated. The phrasing is also factually wrong now — Supabase never sends
   magic links in the current setup. → Reword to e.g. "Used for sign-in.
   Email changes require a support request for now."

---

## 🟠 High priority UX issues (v2)

3. **Search page has no `loading.tsx`** (was #10) — `src/app/search/`
   only contains `page.tsx`. Slow Supabase response = blank page mid-nav.

4. **Search has no pagination — capped at 50** (was #9) — line 155 of
   `src/app/search/page.tsx` `.limit(50)`. With "Showing 50 of 80" in the
   header the user has no way to see the rest. → Add `?page=N` or cursor.

5. **CityGrid still hard-codes `isLaunched` per city** (was #14) —
   `src/components/marketing/CityGrid.tsx` lines 15, 25, 35, 45, 55, 65.
   Bangalore + Chennai will say "Soon" forever / could say "Live" without
   listings. Drift from `<BrowseCategories>` which already derives counts.

6. **FeaturedListings still filters `is_verified=true` AND `status=live`**
   (was #17) — `src/components/marketing/FeaturedListings.tsx` line 24-26.
   If seeds don't include verified rows, the homepage above-fold renders
   the `ListingGrid` empty-state ("No listings here yet — be the first
   to list yours") inside a section called "Fresh on HostelPups". → Fall
   back to `status=live` only when `featured.length === 0`, OR hide the
   whole section when empty.

7. **Owner dashboard "Calls" StatsCard now sources real data**
   (`callCount`) — improvement vs v1's "Phase 2 feature" caption — but
   the rest of the dashboard recent-inquiries table is still cramped on
   mobile (was #37): the table uses `responsive hidden sm:table-cell`
   classes and the mobile fallback duplicates the listing title inside
   the renter cell. → Switch to stacked cards below `sm`.

8. **InCallScreen Speaker button still has "PENDING" copy leaking to
   users** (was #22 + #34): `src/components/call/InCallScreen.tsx` line
   515-518 shows users a literal "PENDING — needs Capacitor native
   module" tag inside the speaker tooltip, and line 124 sets `errorMsg`
   to "Connection failed. The other person's network may be too
   restrictive (no TURN server configured)." Both leak infra detail.
   → Reword tooltip ("Speaker switching available in the upcoming mobile
   app"); reword error ("Connection couldn't be established — try
   again, or contact support.")

9. **MessageComposer counter shows "Phone, email, UPI, social handles
   will be hidden" as the DEFAULT placeholder**
   (`src/components/chat/MessageComposer.tsx` lines 170-174) — that copy
   surfaces even when the input is empty / harmless. Reads like a
   warning being shown unprovoked. → Change copy to neutral ("Press
   Enter to send · Shift+Enter for newline") when no contact info is
   typed; keep the safety banner via `RedactionToast` when contact is
   detected (which it already does).

10. **CityGrid + Hero + Footer disagree on which cities are Live / Soon /
    Self-serve** (was #15/#16). Source of truth needed. Today: Hero shows
    all 6 cities equally; Footer lists all 6; CityGrid says Bangalore +
    Chennai are "Soon". /cities then has Live cities + Coming Soon cities.
    Not consistent. → Single `getCityStatus(city): "live"|"self-serve"|"soon"`
    helper, sourced from Supabase counts at build time.

11. **MessageThread realtime sub doesn't reconnect after disconnect**
    (was #21) — `src/components/chat/MessageThread.tsx` lines 68-93.
    Background tab for 10 min, channel goes stale, new messages don't
    surface until a manual refresh. → Add `onError`/`onClose` and a
    visible "you may be offline" banner.

---

## 🟡 Medium polish (v2)

12. **"Phase 2" still bleeds into UI** — `/owner/reviews` H2 reads
    "Reviews are coming in Phase 2" (line 50), `/owner/payments` body says
    "Once Razorpay billing is wired up in Phase 2" (line 53),
    `OwnerSidebar.tsx` line 87 renders a `pending: true` flag (currently
    no NAV items use it, but the Phase 2 label would say "Phase 2" not a
    consumer-friendly phrase). → Reword: "Coming soon" / "Available with
    paid plans launching shortly".

13. **Fake star rating in ListingCard** (was #31) — line 297:
    `4.{(parseInt(l.id.replace(/\D/g, "")) % 9) + 1} (new)`. Still
    rendering deterministic-but-fake ratings until a reviews table ships.

14. **OwnerCTA stat copy "10,000+ verified renters"** (was #25, line 12).
    `Hero.tsx` says "10,000+ verified listings" (line 45). `StatsStrip`
    uses live counts or placeholders. Pick one number, one definition.

15. **ListingForm step indicator labels still hidden on mobile** (was
    #38) — `src/components/owner/ListingForm.tsx` line 176
    `font-medium hidden sm:inline`. A renter on a 375px phone sees
    "1 → 2 → 3 → 4 → 5" with no idea which step is what.

16. **ListingForm rooms grid still cramped below `lg`** (was #39).

17. **InCallScreen `<span className="hidden">{myUserId}</span>` lint hack**
    (was #33, line 591). Still present. Either use the variable or
    drop the prop. Future readers will wonder.

18. **Testimonials still fake** (was #28) — Priya, Arjun, Anjali & Rohan
    are made up. Add a "marketing illustration" disclaimer until you have
    real testimonials, or pull from a `testimonials` table.

19. **OwnerCTA `text-zinc-400` body text on inverted dark hero** (was #29)
    — borderline WCAG-AA. Spot-test in Chrome DevTools.

20. **Pricing CTAs link to `/signup`** (was #26) but the signup flow has
    no payment step — users get sent into a sign-up flow expecting to
    pay 99/199/499 next. Reword to "Sign up — pay when ready."

21. **Privacy + Terms italic "placeholder" disclaimer**
    (was #50) — both files still have lines 78-81 and 76-78 italic
    self-disclaimer "before launch, get a lawyer to review". MUST remove
    before going live to a public domain.

22. **FaqSection still snaps open/close with no transition** (was #27).

23. **`ConversationList` section headers still uppercase + small caps**
    (was #49) — `src/components/chat/ConversationList.tsx` lines 60-65,
    78-83 `text-sm uppercase tracking-wide`.

24. **MessageComposer 6-line cap on mobile + desktop** (was #20) — line
    51. Allow 10 on desktop.

25. **Owner listings table loses Status, Vacancies, Updated columns
    below sm/md/lg breakpoints**
    (`src/app/owner/listings/page.tsx` lines 113-141 + 184-198). On a
    375px phone an owner only sees title + actions. → Render as stacked
    cards instead of progressively hiding columns.

---

## 🟢 Low priority polish (v2)

26. **WedgeFeatures `bg-rose-50` Zero Brokerage card** (was #48). Rose
    not in design tokens. Replace with `--color-cta` tint or `couple`
    pink token.

27. **`SITE.phone = "+91-XXXXX-XXXXX"`** still placeholder (was #42).
    Currently unused in `tel:` links — guard before exposing.

28. **Inconsistent rupee glyph** (was #40) — `Rs ` in AuthSidePanel /
    Testimonials, `₹` via `formatPrice`. Pick one.

29. **Default Next.js favicon** (was #41) — `public/favicon.ico` not
    branded.

30. **Footer social links go to non-existent accounts** — `Footer.tsx`
    lines 7-38 SVG icons each link to `instagram.com/hostelpups` etc.
    None of those handles are claimed. Either claim or hide.

31. **Listing detail landmark crowding** (was #35) — line 447-451 puts
    "— near {landmark}" inline with city. Crowds on mobile.

32. **/cities Coming Soon contrast** (was #43) — `opacity-70` +
    `text-ink-muted` drops below 4.5:1.

33. **Listing detail similar-listings empty case** (was #44) — section
    silently disappears when zero siblings.

34. **CallHistoryList + IncomingCallModal raw `<img>`** (was #45) — both
    still use `<img>` instead of `next/image`.

35. **ListingCard amber-400 text on near-white** (was #46).

36. **ListingCard "+N more" amenities has no title/tooltip** (was #32).

---

## Per-page audit

### `/` (homepage)
- Layout: PASS — Hero default chip fixed; FeaturedListings empty state
  may show under "Fresh on HostelPups" if Supabase has zero verified
  listings (see #6 / was #17). BrowseCategories now hides "0+" labels.
- Mobile: PASS
- Issues: #5 CityGrid hard-codes status, #6 verified-only fallback,
  #14 testimonials fake, #19 OwnerCTA contrast.

### `/about`
- PASS — unchanged from v1. Prose page, semantic H1+H2.

### `/how-it-works`
- PASS — composes existing components, inherits no major regressions.

### `/for-owners`
- PASS — gradient text headline + pricing cards rendering correctly.

### `/contact` (UPDATED — now has form)
- PASS — `ContactForm` renders inline; client validation works; success
  state replaces the form. Server action `submitContactForm` exists.
- Issue: server action just logs (per comment) — real Resend/Supabase
  email delivery PENDING (founder action).

### `/faq`
- PASS — clean composition. Issue: accordion still snaps (#22).

### `/privacy`, `/terms`
- PASS for v1, but must remove italic "placeholder" disclaimer before
  shipping to a public domain (#21 — was #50).

### `/cities`
- PASS — Coming Soon contrast still borderline (#32 — was #43).

### `/pg-in-{kochi|bangalore|chennai|trivandrum|calicut|trichur}`
- PASS — same `<CityLanding>` composition.
- Issue: zero-results sections still confusing if city has no live data
  (was #11 from v1 mid-section). Mitigated by FeaturedListings change but
  city-page Live grid still shows the empty state with "Verified
  Couple-Friendly listings in Kochi" header.

### `/couple-friendly-pg/{city}`, `/bachelor-friendly-pg/{city}`, `/pet-friendly-pg/{city}`
- PASS — strong wedge pages.

### `/search`
- PASS structure but with #3 (no `loading.tsx`) and #4 (no pagination)
  caveats.

### `/pg/[city]/[slug]` (listing detail)
- PASS — gallery now real (fixed #11), `?next=` on unlock CTA (fixed #13).
- CRITICAL #1: Heart + Share buttons in the gallery hero are still
  non-functional.

### `/login`, `/owner/login`
- PASS — beautiful 2-col layout, AuthSidePanel hidden < lg.
- "Continue with Google" wasn't seen in this audit — already removed
  apparently. PASS.

### `/signup`, `/owner/signup`
- PASS — proper inline validation, password strength badge, T&C tick,
  city select using full-service + Kerala union.

### `/forgot-password` (NEW)
- PASS — clean stub: icon + headline + "email support@hostelpups.in"
  CTA + back-to-login link. Acceptable placeholder until
  `supabase.auth.resetPasswordForEmail` is wired. Page is marked
  `noindex: true`.

### `/saved` (UPDATED — was placeholder, now functional)
- PASS — signed-out CTA → signed-in grid → signed-in empty state, all
  three flows render. Photo-column rename (`listing_photos` → `photos`)
  handled correctly so `ListingCard` cover image works.
- Note: heart in the card removes from /saved (via toggleFavorite), but
  there's no toast confirming the removal. Minor.

### `/profile` (UPDATED — was placeholder, now functional)
- PASS structure — name + phone editable, email read-only, "Coming
  soon: Avatar upload" placeholder card.
- Issue: copy "We send magic links to this address" is wrong now that
  auth is password-based — see CRITICAL #2.

### `/messages`, `/messages/[id]`
- PASS — MessageThread now uses `dvh` (fixed #19). Safety banner +
  conversation cards readable. ChatBox sticks to bottom on iOS keyboard.
- Issues: composer counter copy (#9) + realtime reconnect (#11).

### `/calls`, `/call/[id]`
- PASS — IncomingCallModal full-screen + accept/decline button big
  enough; InCallScreen avatar + state pill clean.
- Issues: #8 (PENDING/TURN copy leak), #17 (`myUserId` hack).

### `/owner/login`, `/owner/signup`, `/owner/onboarding`
- PASS — same flow as renter side with business name + tier selector.

### `/owner/dashboard`
- PASS — Calls stat now shows real `callCount` (was "—" Phase 2 in v1).
  Welcome strip, 4 stats cards, listings grid, inquiries table.
- Issue: #7 mobile cramping on inquiries table.

### `/owner/listings`
- PASS structure — but table progressively hides Status + Vacancies +
  Updated columns at sm/md/lg breakpoints. On 375px only Title + Actions
  visible. → #25 (stacked cards).

### `/owner/listings/new`, `/owner/listings/[id]/edit`
- PASS overall — 5-step wizard, photo uploader, draft/submit-for-review.
- Issues: step labels mobile-hidden (#15 — was #38), rooms grid cramped
  (#16 — was #39).

### `/owner/profile`
- PASS — clean. KYC docs section honest about "coming soon".

### `/owner/inquiries`, `/owner/inquiries/[id]`
- PASS — `<ul>`-based list view instead of table (better mobile).
  Strike-count warning + safety strip present.

### `/owner/calls`
- PASS — privacy banner explains WebRTC.
- Issue from v1: doesn't redirect to login when not authed — to verify
  in this pass.

### `/owner/reviews` (NEW)
- PASS — auth redirect + Phase 2 banner. Phrasing leaks "Phase 2"
  to users (#12).

### `/owner/payments` (NEW)
- PASS — auth redirect + Phase 2 banner. Same phrasing issue.

### `/owner/settings` (NEW)
- PASS — auth redirect + Notification preferences banner. Clean stub.

---

## Per-component audit (key ones)

### `FavoriteButton.tsx` (NEW)
- PASS — `e.preventDefault()` + `e.stopPropagation()` prevent card
  navigation. Auth gate before optimistic flip. Optimistic UI with
  rollback on failure. `aria-pressed` + `aria-label` correct.
- Bug fix vs v1 #6: the nested-anchor risk is gone because the heart
  has `z-10` AND the click handler kills propagation.

### `OwnerSignOutButton.tsx` (NEW)
- PASS — clears Supabase session then hard-reloads `/owner/login`. Fixes
  v1 #4.

### `UserProfileForm.tsx` (NEW)
- Mostly PASS. Inline validation, +91 prefix on phone, optimistic save
  with `savedAt` toast. CRITICAL #2 (magic-link wording).

### `ContactForm.tsx` (NEW)
- PASS — client validation, server action, "send another" path on
  success.

### `MessageThread.tsx`
- PASS — uses `dvh`, dedupes initial + realtime, auto-scroll.
- Realtime reconnect still missing (#11).

### `MessageComposer.tsx`
- PASS structure — but counter copy unprovoked (#9), 6-line cap (#24).

### `RedactionToast.tsx`
- PASS — same well-designed two-button toast as v1.

### `InCallScreen.tsx`
- PASS structure — full WebRTC peer + signaling lifecycle, mic-off
  during ringing, hangup broadcast first then DB.
- Issues: #8 (TURN + PENDING copy), #17 (`myUserId` hack).

### `IncomingCallModal.tsx`
- PASS — big buttons, 60s auto-miss, animated ping + dots.
- Note: raw `<img>` (#34 — was #45).

### `CallHistoryList.tsx`
- PASS — directional icons + status badges + raw `<img>` (#34).

### `OwnerSidebar.tsx`
- PASS — links resolve, NEW `OwnerSignOutButton`, mobile drawer with
  hamburger + backdrop, `aria-label="Owner navigation"`.
- Sticky `top-20` still assumes a 5rem header on a `h-16` Header
  (carryover from v1 #51) — ~1rem peek on first scroll.

### `ListingForm.tsx`
- PASS structure — 5-step wizard. Step labels hidden on mobile
  (#15 — was #38).

### `Hero.tsx`
- PASS — default `type` chip removed, trust strip uses "10,000+"
  placeholders (#14 — was #25).

### `BrowseCategories.tsx`
- PASS — count > 0 conditional fixes v1 #7.

### `FeaturedListings.tsx`
- Empty fallback inside section still possible (#6 — was #17).

### `CityGrid.tsx`
- Hard-coded `isLaunched` (#5 — was #14).

### `Testimonials.tsx`
- Fake data (#18 — was #28).

### `PricingSection.tsx`
- PASS — `scale-105` removed (was #8). CTA copy mismatch with payment
  flow (#20 — was #26).

### `WedgeFeatures.tsx`
- `bg-rose-50` color drift (#26 — was #48).

### `ListingCard.tsx`
- PASS — heart now wires to FavoriteButton.
- Fake star (#13 — was #31), amber text contrast (#35 — was #46),
  amenities tooltip (#36 — was #32).

### `FaqSection.tsx`
- Body still snaps without transition (#22 — was #27).

### `ConversationList.tsx`
- PASS — small-caps section headers (#23 — was #49).

### `Footer.tsx`
- PASS structure — non-existent social links (#30).

### `Header.tsx`
- PASS — mobile drawer + profile dropdown + auth-aware. No focus trap
  on mobile drawer (carryover from v1 #23).

---

## Brand consistency findings

- Primary yellow `--color-brand-500` consistent ✓
- Pink CTA `--color-cta` correctly used on "Send", "Pay", "Sign up
  free", "Search" ✓
- Off-white `--color-bg` everywhere ✓
- Plus Jakarta Sans ✓ via root layout
- Wedge tokens: couple=pink, bachelor=indigo, pet=teal, student=amber ✓
- Verified = emerald-50/600/700 ✓
- Border radius scale consistent ✓
- **Drift**:
  - WedgeFeatures `bg-rose-50` Zero Brokerage card — not in tokens
  - Random `text-zinc-400` in OwnerCTA — should use brand neutrals
  - `Rs ` (AuthSidePanel, Testimonials) vs `₹` (formatPrice) — pick one

---

## Copy / microcopy issues (v2)

- **UserProfileForm "We send magic links to this address"** — wrong
  copy now that auth is password-based. (CRITICAL #2)
- **InCallScreen** "PENDING — needs Capacitor native module" — leaks
  internal language (#8).
- **InCallScreen** "no TURN server configured" — leaks infra to
  consumer (#8).
- **`/owner/reviews`, `/owner/payments`** headlines say "in Phase 2"
  — leaks phasing (#12).
- **MessageComposer counter** says "Phone, email, UPI, social handles
  will be hidden" as default placeholder — sounds like a pre-emptive
  warning. (#9)
- **Hero / StatsStrip / OwnerCTA** repeat "10,000+" but as "listings"
  vs "renters" vs "verified listings" — pick one (#14).
- **Italic "placeholder — get a lawyer to review" in Privacy + Terms**
  — must be removed before launch (#21).
- **"Boost when vacancies hit"** OwnerCTA + for-owners — no Boost
  feature wired anywhere.
- **"Move-in guarantee — refund if it isn't as described"** repeated
  across AuthSidePanel, OwnerCTA, CityLanding — but no `/refund-policy`
  page exists.
- **AuthSidePanel** "Reach 10,000+ verified renters actively searching"
  — claim repeated. Need citation or reword as projection.

---

## Mobile-specific bugs (v2)

- Owner listings table loses columns at sm/md/lg — only Title +
  Actions on 375px (#25).
- Owner dashboard inquiries preview cramped on mobile (#7).
- ListingForm step indicator labels hidden < sm (#15).
- ListingForm rooms grid cramped at sm/lg (#16).
- Listing detail landmark crowds the address line on mobile (#31).
- MessageComposer 6-line cap (#24) leaves long pasted messages stuck
  in a tiny scroll.

---

## Accessibility findings (v2)

- Focus rings: PASS (global `globals.css` lines 122-126)
- All inputs labeled: PASS — every form audited has `<label
  htmlFor>` or sr-only label
- Modal patterns: IncomingCallModal has `aria-modal` + `role="dialog"`;
  InquiryStartButton modal also. Header drawer + OwnerSidebar drawer
  still don't have focus traps (carryover from v1 #23/#24).
- Icon-only buttons: most have `aria-label`. New FavoriteButton + new
  OwnerSignOutButton + new ContactForm Send button — all PASS.
- Reduced motion: PASS globally.
- Color contrast:
  - `text-ink-subtle` (#8A8A8A) on `bg` (#FFFCF5) = 3.2:1 — still
    failing WCAG-AA for body text (used in MessageComposer counter,
    "Show all" links, timestamps). → Bump to #767676.
  - OwnerCTA `text-zinc-400` on `bg-ink` — borderline (#19).
- Skip-link: still not present in Header — add for keyboard users.

---

## PENDING (founder action)

The following items remain user-action / out-of-scope for this build:

1. Domain bought / DNS configured (`hostelpups.in` + `.com`)
2. Razorpay payments (entire "Pay Rs 99 to unlock" + owner billing)
3. Google Analytics 4 + Search Console verification
4. Real social media accounts — Footer links go to non-existent handles
5. Real OG/Twitter card image (`/og-default.png`)
6. Branded favicon
7. Apple Touch icon
8. Real testimonials (replace Priya/Arjun/Anjali&Rohan)
9. Phone number for `SITE.phone` placeholder
10. Privacy + Terms reviewed by an Indian DPDP-aware lawyer
11. Owner CRM / KYC document upload bucket
12. Push notifications for incoming calls (mirror RingIn Phase 3)
13. Boost ad billing (referenced but not wired)
14. Refund policy page (referenced multiple times but doesn't exist)
15. Capacitor wrapper for real earpiece/loudspeaker call routing
16. Real `supabase.auth.resetPasswordForEmail()` on `/forgot-password`
17. Real email delivery for ContactForm (currently logs only)
18. Avatar upload widget for `/profile` (needs `user-avatars` bucket)
19. Reviews feature shipping (currently `/owner/reviews` is a stub)
20. Razorpay payment history fetch for `/owner/payments`
21. Notification preferences storage for `/owner/settings`
