# Visual + UX Audit Report — 2026-05-24

Auditor: senior UX engineer pass. Read-only — no code modified.
Scope: every page.tsx in src/app + every component in src/components.
Reference: https://hostelpups.vercel.app, local at C:\Users\johnc\Desktop\HostelPups\hostelpups.

## Summary
- Pages audited: 38 (all public marketing, SEO city/wedge, search, listing detail, all auth pages, user pages, owner pages incl. dynamic routes)
- Components audited: 44 (ui, layout, marketing, listings, chat, call, owner, auth)
- Critical visual/UX bugs: 8
- High priority UX issues: 14
- Medium priority polish: 17
- Low priority: 12
- PENDING (needs founder action / out-of-scope for this build): 9

The product foundation is solid — strong design tokens, consistent buttons/badges,
SEO-rich server components, good empty states on most data lists, and a beautifully
restrained yellow-on-off-white palette. The most damaging gaps right now are not
visual — they are **placeholder user pages that ship to logged-in users**
(`/saved`, `/profile`) and **broken sidebar links to pages that 404**
(`/owner/reviews`, `/owner/payments`, `/owner/settings`). Fix those first, then
clean up the polish items below.

---

## 🔴 Critical visual / UX bugs

1. **`/saved` always shows "Sign in" CTA — even for logged-in users.**
   File: `src/app/saved/page.tsx`. The whole page is a static "Sign in to save"
   placeholder. A logged-in user clicking the Heart in the bottom nav lands here
   and gets told to sign in. The page never queries Supabase, never shows their
   actual saved listings, and the heart button on `ListingCard.tsx` (lines 254-263)
   doesn't even wire up to anything. → Either build the real saved-listings view
   (Supabase `saved_listings` table or localStorage list) or remove `/saved` from
   `MobileBottomNav.tsx` until built.

2. **`/profile` always shows "Sign in" CTA — even for logged-in users.**
   File: `src/app/profile/page.tsx`. Same problem as `/saved`. The page never reads
   the current user. Clicking the bottom-nav Profile tab while logged in is a dead
   end. → Build a real profile screen (user can already get the same content from
   the Header user dropdown, but the dedicated page is now misleading).

3. **`OwnerSidebar` has 3 dead links** that 404 silently.
   File: `src/components/owner/OwnerSidebar.tsx` lines 33-36 reference
   `/owner/reviews`, `/owner/payments`, `/owner/settings`. None of those page.tsx
   files exist. Owners clicking them get Next.js 404. → Remove them, or stub them
   the way `/owner/calls` did (page with PENDING banner). Mark with the same
   `pending: true` badge the Calls nav item uses.

4. **`OwnerSidebar` "Sign out" link does NOT sign out.**
   File: `src/components/owner/OwnerSidebar.tsx` lines 96-103. It's a plain `<Link
   href="/owner/login">` — it navigates to the login page but leaves the Supabase
   session intact. So the user is bounced straight back to /owner/dashboard by
   the redirect on /owner/login (or sees an authed login screen confusingly).
   → Make it a `<button>` that calls `supabase.auth.signOut()` like
   `Header.tsx` does (lines 84-90), then `window.location.href = "/"`.

5. **Hero search button "Search" pre-selects `type=pg`** even when the user
   doesn't want to filter by property type. File: `src/components/marketing/Hero.tsx`
   line 167: `defaultChecked={idx === 0}` ⇒ "PG" is always pre-checked. Then the
   form submits `?type=pg` to `/search`, narrowing results. A user who hasn't
   thought about type just sees fewer results. → Make all chips unchecked by
   default; only submit `type=` when user explicitly picks.

6. **ListingCard nested anchors when "saved" heart shown.**
   File: `src/components/listings/ListingCard.tsx`. The whole card has a `Link`
   wrapping the title and uses `after:absolute after:inset-0` (line 273) to make
   the entire card clickable. The Save heart button on lines 254-263 sits at
   `z-10` to escape that overlay, but there is **no preventDefault on it** — if
   wired up later, the click would bubble and navigate. Also: the heart is
   currently a no-op (saves nothing), exposing critical UX bug #1.

7. **Featured listings + BrowseCategories show "0+ verified" when DB is empty.**
   Files: `src/components/marketing/BrowseCategories.tsx` lines 47-50, 145-148.
   When seeds haven't run / fresh deploy / category has zero listings, the card
   reads literally "0+ verified". Likewise `<FeaturedListings>` renders the
   "No listings yet" empty grid INSIDE a "Verified PGs near you" section — the
   reader sees a section header promising listings followed by a "be the first to
   list" empty state. Confusing on the production homepage if data is sparse.
   → Hide the BrowseCategories count when `count === 0` (e.g. show "Coming
   soon" or "View"). For FeaturedListings: hide the whole section if zero rows
   instead of showing an empty state next to "Fresh on HostelPups".

8. **PricingSection highlighted card uses `scale-105`, overlapping its
   neighbours.** File: `src/components/marketing/PricingSection.tsx` line 73.
   On the 3-col `sm:grid-cols-3` layout the centre card grows 5% and overlaps the
   right card on the small-desktop breakpoint where columns are tight. It also
   creates a hover/focus mismatch with the surrounding cards. → Drop `scale-105`
   or wrap in a column with `relative` and use `lg:scale-105` only at the larger
   breakpoint.

---

## 🟠 High priority UX issues

9. **Search has no pagination.** `src/app/search/page.tsx` line 155 caps results
   at `.limit(50)` and never offers a "load more" / page 2. Users with >50
   matches silently lose listings. → Add cursor or page-based pagination
   (`?page=2`), or at minimum show "Showing 50 of N — refine to see more".

10. **Search has no loading state.** Server component renders synchronously, but
    if Supabase is slow the user sees a blank page mid-navigation. → Add a
    `loading.tsx` skeleton (Next.js convention) under `src/app/search/`.

11. **Listing detail says "Photo gallery loading in Phase 1"** even on production.
    `src/app/pg/[city]/[slug]/page.tsx` line 343. To a renter, "Phase 1" is
    insider jargon — it reads as broken. The gallery placeholder also looks
    suspiciously like a half-built page. → Replace with consumer-friendly copy:
    "Owner photos coming soon" or, ideally, render real photos when
    `listing.photos.length > 0` (the data is fetched on line 213, just unused
    above the fold).

12. **Listing detail Heart + Share buttons are non-functional.** Same file,
    lines 326-340. They open nothing, save nothing, share nothing. → Wire heart
    to localStorage at minimum; wire share to `navigator.share` with copy-link
    fallback. Or hide them until built.

13. **"Unlock contact" CTA on listing detail goes to `/signup`** with no return
    path. `src/app/pg/[city]/[slug]/page.tsx` line 566. After signup they land at
    home, losing the listing context. → Add `?next=/pg/${city}/${slug}` to that
    URL so the user lands back on the listing.

14. **CityGrid hard-codes per-city status as `isLaunched`**, not synced to
    actual database. `src/components/marketing/CityGrid.tsx` lines 16, 22 etc.
    Bangalore and Chennai will read "Soon" on the homepage long after they go
    live (or could read "Live" without any actual listings). → Derive `isLaunched`
    + listing count from Supabase, like `<BrowseCategories>` already does.

15. **CityGrid + CitiesPage don't include Trivandrum / Calicut / Trichur on
    homepage `cities` array correctly:** wait — Trivandrum IS in
    `CityGrid.tsx` line 38 (`Self-serve listings`), but the homepage CityGrid
    treats Bangalore + Chennai as `isLaunched: false`. Yet
    `/pg-in-bangalore` and `/pg-in-chennai` exist and use `CityLanding`. So
    "Soon" is wrong if listings exist. → Source `isLaunched` from the same
    Supabase count query, not hand-typed.

16. **`<Hero>` city dropdown — Trivandrum, Calicut, Trichur are listed but
    homepage CityGrid only shows them as Kerala self-serve.** Mixed messaging.
    Add the same status (Live, Self-serve, Coming soon) consistently across
    Hero / Footer / Cities page.

17. **Featured listings on homepage filter for `is_verified=true` AND
    `status=live`** — `src/components/marketing/FeaturedListings.tsx` line 16.
    If the seeds don't include any verified listings, the homepage above-fold
    shows an empty grid forever. → Fall back to `status=live` only when zero
    verified results, OR ship seeded verified listings before launch.

18. **/contact has no contact form.** `src/app/contact/page.tsx`. It links 3
    `mailto:` addresses and asks users to email. On mobile this opens a native
    mail app many users don't have configured → broken. → Add a simple form
    that POSTs to a server action and emails the right team. Even a Formspree
    URL is fine for v1.

19. **`/messages` height assumption breaks on mobile keyboards.**
    `src/components/chat/MessageThread.tsx` line 103: `h-[calc(100vh-12rem)]`.
    On iOS / Android, the visible viewport shrinks when the keyboard opens
    → the composer is pushed offscreen and the scroll log overflows. → Use
    `dvh` (dynamic viewport height) instead of `vh`, or a flexbox column with
    `min-h-0` parent.

20. **MessageComposer textarea max-height capped at "6 lines × 24px"
    (`144px`)** — `src/components/chat/MessageComposer.tsx` line 51. On mobile
    that's 4 visible lines after padding. Pasted long messages disappear into a
    tiny scroll area. → Allow up to 10 lines on desktop, but switch to native
    `field-sizing: content` once Safari catches up, or use a sentinel-based
    auto-grow that respects parent height.

21. **MessageThread realtime subscription doesn't handle disconnect/reconnect
    gracefully.** Same file, lines 68-93. If the user backgrounds the tab for
    10 min the channel may go stale. → Add an `onError`/`onClose` callback
    that re-subscribes, and a "you may be offline" banner.

22. **CallScreen Speaker button has a "Soon" badge but is not visibly
    disabled.** `src/components/call/InCallScreen.tsx` lines 470-495. The user
    can press it; it toggles `speakerOn` UI state but doesn't actually do
    anything. The aria-label says "PENDING native" which is fine for
    screen readers but on visual UI it just looks like a working button. →
    Either add `disabled` (and gray out) or wire the toggle to show the "needs
    mobile app" tooltip (`showSpeakerNote` exists but I couldn't see the
    handler trigger it).

---

## 🟡 Medium priority polish

23. **Header's mobile menu drawer doesn't trap focus.**
    `src/components/layout/Header.tsx` line 213. Tabbing while drawer is open
    can move focus to elements behind the backdrop. → Add a focus-trap.

24. **Header profile dropdown has no keyboard escape** — `Escape` should close
    it. Currently only outside-click closes. Lines 71-82.

25. **Hero trust pill "10,000+ verified listings"** + StatsStrip "10,000+
    verified renters" + Hero stat "10,000+" — all the same hard-coded number
    in three places. Inconsistent: same value styled as "listings", "renters",
    "renters" in different sections. → Decide which it is, and ideally pull
    from `count` queries.

26. **PricingSection user plans link to `/signup`** but the description says
    "Pay only when you're actively looking" — the signup flow currently has no
    payment step. Misleading. → Reword "Start with 7 days" to "Sign up — pay
    when ready" until payments ship in Phase 2.

27. **`<FaqSection>` chevron rotates but the body doesn't animate** —
    `src/components/marketing/FaqSection.tsx` lines 60-64. The accordion
    snaps open/close with no height transition. → Add a Radix Accordion or
    a CSS grid `grid-template-rows: 0fr → 1fr` transition.

28. **`<Testimonials>` is fake data (Priya Menon, Arjun Krishnan, Anjali &
    Rohan).** Acceptable for v1 launch but flag clearly to the founder that
    these need real testimonials before "Trustpilot"-style marketing kicks in.
    No "marketing illustration" disclaimer either.

29. **`<OwnerCTA>` "Boost when vacancies hit"** — uses lucide `TrendingUp`
    inside a dark inverted section. Icon contrast is fine but the body copy
    on dark `bg-[var(--color-ink)]` uses `text-zinc-400` which is borderline
    WCAG-AA on the brand-tinted backgrounds. Test contrast.

30. **`<FeaturedListings>` "View all listings" link uses a smaller version of
    the section's heading colour (`text-[var(--color-brand-700)]`)** but on
    `bg-bg` background the underline-on-hover contrast is good — minor: the
    arrow icon has no rotation/movement on hover, unlike other "View" links.

31. **ListingCard star rating is fake** — `src/components/listings/ListingCard.tsx`
    line 293: `4.{(parseInt(l.id.replace(/\D/g, "")) % 9) + 1} (new)`. This
    generates a deterministic-but-fake star rating from the listing ID. Will
    read "4.7 (new)" without any actual reviews. → Hide the star until you
    have a reviews table.

32. **ListingCard "+N more" amenities is implemented but doesn't have a
    title/tooltip showing what they are** (line 314). Hovering tells the user
    nothing.

33. **CallScreen's "myUserId" prop is rendered hidden** —
    `src/components/call/InCallScreen.tsx` line 515: `<span className="hidden">
    {myUserId}</span>` to silence an unused-var lint. This is a hack — either
    use the variable or remove the prop. Future readers will be confused.

34. **CallScreen 15s connection timeout** is reasonable but the failure
    message references "no TURN server configured" (line 119) — user-facing
    copy that exposes infra detail. → Reword to "Connection couldn't be
    established. Try again, or contact support."

35. **ListingPage doesn't show `landmark` consistently** if it's set but on
    line 357 it's appended `— near {landmark}`. The em-dash + word "near"
    inside the address line gets crowded on mobile. → Move landmark to its
    own line under the address.

36. **Owner dashboard "Calls" stat card shows `—` and "Phase 2 feature"** —
    `src/app/owner/dashboard/page.tsx` lines 150-158. But `/owner/calls`
    already exists with call data. So either the dashboard stat should
    actually count calls, or hide the stat until aligned.

37. **Owner dashboard inquiries preview table** uses `responsive hidden`
    columns but the mobile fallback (`<p className="text-xs sm:hidden">`
    line 357) repeats the listing title inside the renter cell. Layout is
    cramped on a phone. → On mobile, render as stacked cards instead of a
    table.

38. **ListingForm step indicator labels are hidden on mobile** (line 174-184
    `hidden sm:inline`). On a phone the user only sees "1 → 2 → 3 → 4 → 5"
    numbers with no labels. → Show the active label even on mobile.

39. **ListingForm rooms grid (`sm:grid-cols-[2fr_1fr_1fr_1fr_auto]`)** is
    very dense — at the `sm` breakpoint (640px) it's almost crammed and
    barely usable. → Move to a vertical/stacked layout below `lg` (1024px).

---

## 🟢 Low priority

40. **Inconsistent rupee glyph usage.** Some places use `Rs ` (e.g.
    `AuthSidePanel.tsx` lines 19, 24, `StatsStrip.tsx` line 32, testimonial
    quotes), others use `₹` (most price labels via `formatPrice()`).
    → Decide one and run a find/replace.

41. **Footer + Header `HP` brand mark** is uppercased monogram on a yellow
    square — fine, but the favicon (`/favicon.ico`) is the default Next.js
    file (not branded). → Replace.

42. **`SITE.phone = "+91-XXXXX-XXXXX"`** placeholder string in
    `src/lib/site.ts` line 13. If ever read into a tel: link it'll break.

43. **`/cities` Coming Soon cities (Kollam, Kannur, Kottayam, Palakkad)** are
    listed as `<div aria-disabled="true">` non-link cards (good!) but their
    color contrast (`opacity-70` + `text-ink-muted`) drops below 4.5:1.

44. **`/pg/[city]/[slug]` similar-listings section** shows up only when
    `siblings.length > 0`; if the city has only 1 listing the user sees
    nothing. → Fall back to "Other verified PGs across India" so the page
    never ends abruptly.

45. **CallHistoryList `<img>` is raw HTML** — `src/components/call/CallHistoryList.tsx`
    line 148. Comment acknowledges this. Migrate to `next/image` for
    LCP/cache wins. Same for `IncomingCallModal.tsx` line 120.

46. **`ListingCard.tsx` star color** — `fill-amber-400 text-amber-400` on a
    near-white card. The `text-amber-400` is too light for the label "(new)"
    sitting beside it. → Use `amber-600` for the text only.

47. **`<Hero>` background absolute glow elements** use `opacity-40` /
    `opacity-50` — they extend off the page on mobile, slightly affecting
    horizontal scroll if `overflow-hidden` on the section drops. Verify in
    Chrome DevTools 375×667.

48. **WedgeFeatures `bg-rose-50` for "Zero Brokerage" card** — visually
    inconsistent with the rest of the design tokens. Rose isn't a brand
    color. → Use one of `couple` (pink), `bachelor` (indigo), `pet` (teal),
    `student` (amber) or the brand palette.

49. **Conversation list "From renters" + "Your inquiries" section headers** —
    `src/components/chat/ConversationList.tsx` lines 60-66 — are small caps
    (`text-sm uppercase tracking-wide`). They look like nav category labels
    rather than meaningful sections. → Use `text-base font-bold` with normal
    case.

50. **Privacy + Terms pages have an italic "placeholder — get a lawyer to
    review"** disclaimer at the bottom (lines 78-81 and 76-78 respectively).
    Acceptable for v0 but please don't ship to production without removing
    this — it screams "untrustworthy" to renters and especially Google's
    quality review.

51. **OwnerLayout puts the dashboard inside `lg:flex-row gap-6` columns**
    `src/components/owner/OwnerSidebar.tsx` line 196 — but on the desktop
    sidebar's sticky top (line 164) is `top-20`, which assumes a 5rem
    header. Header.tsx is `h-16` (4rem) — close but you'll see ~1rem of
    sidebar peeking past the header on first scroll.

---

## Per-page audit

### `/` (homepage)
- Layout: PASS
- Mobile: PASS (hero scales well; trust strip 3-col holds at 375px)
- Empty states: WEAK — BrowseCategories shows "0+ verified" if zero seeded;
  FeaturedListings renders empty-state block under a "Fresh on HostelPups"
  heading. See critical #7.
- Specific issues: CityGrid hard-coded `isLaunched`; PricingSection
  `scale-105` overlap; Hero default `type=pg` chip.

### `/about`
- Layout: PASS — clean prose page
- Mobile: PASS
- Specific issues: H1 + H2s read well; "Where we're live" hard-codes city
  list (could pull from `KERALA_CITIES`).

### `/how-it-works`
- PASS — composes existing components. Only issue is the embedded `<PricingSection>`
  inheriting its overlap bug.

### `/for-owners`
- PASS — pricing cards stack well, gradient text on H1 looks good
- Mobile: PASS — but the H1's `<br />` followed by gradient text breaks
  awkwardly at exactly the 540px breakpoint
- Issue: "Crown" lucide icon in the `Most Popular` badge — only first 50
  owners get free signup according to copy line 167-168, but the badge
  doesn't reflect that

### `/contact`
- Issue: No actual contact form. See #18.

### `/faq`
- PASS — clean. Issue: FaqSection accordion has no body animation.

### `/privacy`, `/terms`
- PASS — content fine for v1. Remove italic "placeholder" disclaimer
  before launch. See #50.

### `/cities`
- PASS — both Live + Coming Soon sections are clear
- Issue: Color contrast on Coming Soon cards. See #43.

### `/pg-in-{kochi|bangalore|chennai|trivandrum|calicut|trichur}`
- All share `<CityLanding>` — PASS overall
- Issue: when a city has zero listings, the "Top verified PGs" empty state
  inside a section called "Live now" is confusing. → Match #7's fix:
  hide the section header if the grid is empty.
- Issue: Wedge filter pills (Couple/Bachelor/Pet/Women/Men) all link off-city
  navigation but the data underneath each link is identical for unseeded
  cities — landing on /search?city=bangalore&gender=women may show 0 results.

### `/couple-friendly-pg/{city}`, `/bachelor-friendly-pg/{city}`, `/pet-friendly-pg/{city}`
- PASS — strong copy + pain-points + answer structure
- Issue: When city has zero wedge listings the page silently swaps to
  "national" results without clarifying — the heading still reads "Verified
  Couple-Friendly listings in Kochi" if data is sparse... wait, the
  component does swap the heading to "across India" on line 154 ✓. Good.

### `/search`
- PASS with caveats — see #9, #10
- Issue: When you remove all filters via "Clear all", the page reloads to
  the same URL — clicking it does nothing if no filters were active
- Issue: Mobile filter `<details>` element doesn't visually communicate
  "open" state when filters are applied — count badge is good but the
  filters appearing as inline expanded panels is unfamiliar UX (vs sheet
  modal)

### `/pg/[city]/[slug]` (listing detail)
- PASS structure
- Issues: see #11, #12, #13. Plus #35 (landmark crowding).

### `/login`, `/owner/login`
- PASS — beautiful two-column layout with side panel
- Issue: AuthSidePanel is hidden on mobile (good — `hidden lg:flex`) but
  this means a mobile user signs in to a page with no marketing prop. Fine
  for return users, slightly cold for first-time sign-in.
- Issue: "Continue with Google" button shows but Google sign-in is
  hardcoded-disabled with an error message ("coming soon"). Should be
  hidden or visually disabled.

### `/signup`, `/owner/signup`
- PASS — same layout as login
- Issue: The "Renter / Business" AuthModeToggle is excellent — clear,
  prominent, server-rendered

### `/saved`, `/profile`
- FAIL — placeholders. See #1 and #2.

### `/messages`, `/messages/[id]`
- PASS — solid empty state, safety banner, conversation cards readable
- Issues: see #19, #20, #21 for height/keyboard, composer cap, realtime
  reconnect

### `/calls`, `/call/[id]`
- PASS — call history empty state is good, in-call screen is gorgeous,
  IncomingCallModal looks legitimate
- Issues: see #22 (Speaker button) and #34 (TURN error message)

### `/owner/login`, `/owner/signup`, `/owner/onboarding`
- PASS — all three flow correctly

### `/owner/dashboard`
- PASS — welcome strip is friendly, stat cards readable
- Issues: #36 (Calls stat says Phase 2 but /owner/calls exists), #37
  (inquiries mobile table cramped)

### `/owner/listings`
- PASS structure. Issue: table is scrollable on mobile (horizontal overflow
  hidden behind `overflow-x-auto`?), but actually it doesn't have one — the
  columns just hide on smaller breakpoints via `hidden sm:table-cell` etc.
  Loses information density (vacancies disappear < md).

### `/owner/listings/new`, `/owner/listings/[id]/edit`
- PASS — the 5-step form is genuinely good. Step indicator works,
  validation is helpful, save-as-draft is implemented.
- Issues: #38 (mobile step labels hidden), #39 (rooms grid cramped < lg).

### `/owner/profile`
- PASS — clean. KYC docs section honestly says "coming soon".

### `/owner/inquiries`, `/owner/inquiries/[id]`
- PASS — strike-count warning is well-designed; safety strip is consistent
  with `/messages/[id]`

### `/owner/calls`
- PASS — privacy banner explains WebRTC well
- Issue: Doesn't redirect to login when not authed — shows the layout with
  empty `businessName` and an empty list. → Add `if (!user) redirect(...)`.

---

## Per-component audit

### `Button.tsx`
- PASS. Five variants, three sizes, supports `href` for Link conversion,
  `fullWidth`, and external URL detection. Slightly opinionated rounded-full
  for all sizes — works visually for this brand.

### `Badge.tsx`
- PASS. Eight tones covering brand + 4 wedges + success/warning/danger.

### `Card.tsx`
- PASS. Single variant + optional hover. Underused — most pages compose
  their own card shells inline. → Adopt or remove for consistency.

### `Container.tsx`
- PASS. 4 sizes (sm/md/lg/xl). Used everywhere.

### `Header.tsx`
- Mostly PASS. See #23 + #24 for focus/escape on mobile drawer.
- Good: auth-aware profile dropdown, scroll-aware background, mobile drawer
  drops below 1024px.

### `Footer.tsx`
- PASS. 4-col link grid + brand + socials. All links resolve.
- Issue: Social links go to `https://instagram.com/hostelpups` etc. — those
  accounts may not exist yet, leading to 404 pages on Instagram/Twitter/etc.
  → Either claim those handles now or remove the icons until ready.

### `MobileBottomNav.tsx`
- PASS. 5 items, safe-area-inset bottom respected, hides on `/owner` paths.
- Issue: Saved + Profile tabs lead to placeholder pages (see #1 + #2).

### `Hero.tsx`
- Mostly PASS. See #5 (default type=pg), #16 (city consistency).

### `FeaturedListings.tsx`
- See #7 (empty state inside section).

### `BrowseCategories.tsx`
- See #7 ("0+ verified" copy).

### `WedgeFeatures.tsx`
- PASS. Six cards with distinct icon tints. Issue: rose color drift (#48).

### `CityGrid.tsx`
- See #14, #15.

### `Testimonials.tsx`
- PASS visually. Issue: fake data (#28).

### `OwnerCTA.tsx`
- PASS. Inverted dark section is striking. Issue: contrast (#29).

### `PricingSection.tsx`
- See #8 (scale overlap), #26 (CTA mismatch with payments).

### `FaqSection.tsx`
- PASS structure. Issue: no expand animation (#27).

### `StatsStrip.tsx`
- PASS. 4-col grid stacks 2-col mobile.

### `ListingCard.tsx`
- See #6 (nested anchor risk), #31 (fake star rating), #46 (star color).

### `ListingGrid.tsx`
- PASS. Empty state is the best in the project — clear, friendly, CTA.

### `FilterSidebar.tsx`
- PASS. Good empty-friendly design.
- Issue: "Price range" group says "Coming soon" — fine, but it's the only
  group with no interaction. Consider hiding entirely until built (would
  also save vertical space on mobile).

### `MessageThread.tsx`
- See #19, #21.

### `MessageBubble.tsx`
- PASS. "was_redacted" notice is clear, me/them differentiation is solid.

### `MessageComposer.tsx`
- See #20.

### `RedactionToast.tsx`
- PASS. Clear, friendly, two-button CTA (Edit / Send anyway). Excellent.

### `InquiryStartButton.tsx`
- PASS. Modal works correctly, redaction toast surfaces inline.

### `ConversationList.tsx`
- PASS. Two sections (owner-side / renter-side) labeled clearly.
- Issue: #49 — section headers feel like nav labels.

### `CallButton.tsx`
- PASS. Auth check is client-side before server action — good UX.

### `InCallScreen.tsx`
- PASS overall. Issues: #22 (Speaker button), #33 (myUserId hack), #34
  (TURN error message).

### `IncomingCallModal.tsx`
- PASS. Big buttons, auto-miss after 60s, animated ping is good.
- Note: no incoming-call ring sound. Acceptable for browser MVP (Web Audio
  to play arbitrary ringtone needs a user-gesture-unlocked context), but
  flag as PENDING.

### `CallHistoryList.tsx`
- PASS. Good directional icons, status badges.

### `OwnerSidebar.tsx`
- See #3 (dead links) + #4 (Sign out doesn't sign out).

### `OwnerOnboardingFlow.tsx`
- PASS. Two-step tier-picker with sensible city-based default.

### `OwnerProfileForm.tsx`
- PASS. Single-source-of-truth for business name + contact phone.

### `ListingForm.tsx`
- See #38, #39. Otherwise excellent — 5-step wizard with validation,
  drafts, success state.

### `PhotoUploader.tsx`
- PASS. Drag-drop, cover toggle, ordering, blob URL revoke on unmount.
  Good attention to detail.

### `ListingRowActions.tsx`
- Not read fully but referenced — handles pause/publish/delete actions.

### `StatsCard.tsx`
- PASS. Clean, 4 tones, `placeholder` flag for "coming soon" stats.

### `AuthSidePanel.tsx`, `AuthModeToggle.tsx`, `LoginForm.tsx`, `SignupForm.tsx`,
`OwnerSignupForm.tsx`
- PASS. The whole auth surface is the strongest part of the app visually.
  See "Auth UX" findings for minor notes.

---

## Accessibility findings

- **Focus rings**: defined globally in `globals.css` lines 122-126 — yellow
  outline + radius. PASS.
- **Reduced motion**: respected globally. PASS.
- **All inputs have labels** (visible or sr-only). PASS.
- **Modal/dialog patterns**: `IncomingCallModal` has `aria-modal="true"` +
  `role="dialog"`; `InquiryStartButton` modal has the same.
  Header drawer + OwnerSidebar mobile drawer do NOT have aria-modal +
  focus trap (#23, #24).
- **Icon-only buttons**: most have `aria-label`. Heart button on ListingCard
  has `aria-label={`Save ${l.title} to favourites`}` — PASS.
- **Color contrast spot-check**:
  - `text-[var(--color-ink-muted)]` (#5C5C5C) on `bg` (#FFFCF5) = 7.0:1 ✓
  - `text-[var(--color-ink-subtle)]` (#8A8A8A) on `bg` (#FFFCF5) = 3.2:1 ✗
    Failing WCAG-AA for body text. Used extensively for "Show all" links,
    timestamps, "characters left" counters. → Either bump subtle to #767676
    (4.5:1) or restrict its use to large-text-only spots.
- **Skip-link**: not present. Add a "Skip to main content" link in the
  Header for keyboard users — easy SEO + a11y win.

---

## Brand consistency findings

- Primary yellow used for primary actions ✓
- Pink CTA used for "Send", "Pay", "Search" ✓
- Off-white background everywhere ✓
- Plus Jakarta Sans throughout ✓ (via root layout)
- Wedge tokens consistent: couple=pink, bachelor=indigo, pet=teal,
  student=amber ✓
- Verified = emerald-50/600/700 ✓ — consistent across Badge / icons
- **Drift**:
  - "Zero Brokerage" wedge feature card uses `bg-rose-50` — not in tokens (#48)
  - Some places use raw `text-zinc-400` (OwnerCTA) instead of brand neutrals
  - `bg-amber-700` (RedactionToast send-anyway button) uses a unique amber
    shade not in the design tokens — should use `var(--color-warning)`
- Rupee glyph mixed: `₹` (formatPrice) vs `Rs ` (some marketing copy)
  (#40)

---

## Copy / microcopy issues

- "Photo gallery loading in Phase 1 — owner pictures coming soon" on every
  listing detail (#11). Says "Phase 1" — leaks internal language.
- "Calls — Phase 2 feature" in OwnerDashboard StatsCard (#36).
- "PENDING — needs Capacitor native module" visible on CallScreen
  speaker tooltip (#22).
- "Boost any listing for ₹99/day" in for-owners while no Boost feature is
  wired anywhere.
- "Move-in guarantee — refund if it isn't as described" repeated across
  AuthSidePanel, OwnerCTA, CityLanding — but no /refund-policy page exists.
- "If this code shipped to production but the migration didn't run" — N/A
  (not user-facing, but worth knowing the codebase reads cleanly).
- Italic placeholder disclaimer in Privacy + Terms (#50) — must be
  removed before launch.
- "Verified renters get 3.2x more contacts" — claim repeated in OwnerCTA
  and AuthSidePanel; needs a source/citation or rewording as projection.
- ListingCard "(new)" + a fake star rating (#31) — replace with a true
  "New listing" badge if no rating yet.

---

## Mobile-specific bugs

- Message thread height uses `vh` not `dvh`, keyboard overlays composer (#19)
- ListingForm rooms grid cramped at 640px (#39)
- ListingForm step indicator labels hidden < sm (#38)
- Header brand mark hides "HostelPups" text < sm — only the "HP" square
  appears. Fine for compactness but the home link is then a small ~36×36
  tap target.
- Owner dashboard inquiries preview overlapping at mobile (#37)
- Owner listings table loses columns < sm (vacancies, updated date hidden)
  — acceptable trade-off but loses key info
- Mobile bottom nav covers content on the call/[id] page — wait, the
  layout `<main>` has `pb-16 lg:pb-0`, so the bottom nav doesn't overlap
  content on mobile pages other than /owner/* (where MobileBottomNav is
  hidden). PASS.
- /call/[id] uses full-screen overlay (`fixed inset-0 z-[100]`) so the
  bottom nav is irrelevant there. Good.

---

## PENDING (founder action / out of scope)

1. Domain not bought / DNS not configured (`hostelpups.in` + `.com`)
2. Razorpay payments — entire "Pay Rs 99 to unlock" + owner billing
3. Google Analytics 4 + Search Console verification
4. Real social media accounts (footer links currently go to non-existent
   `instagram.com/hostelpups` etc.)
5. Real OG/Twitter card image (`/og-default.png` referenced but not
   confirmed in `/public`)
6. Branded favicon (replace default Next.js icon)
7. Apple Touch icon (`/apple-touch-icon.png` referenced)
8. Real testimonials (replacing the 3 hardcoded fake ones)
9. Phone number / WhatsApp business contact for `SITE.phone` placeholder
10. Privacy policy + Terms reviewed by an Indian lawyer (DPDP Act 2023
    compliance)
11. Owner CRM / KYC document upload bucket setup
12. Push notification flow for incoming calls when PWA backgrounded
    (mirror Phase 3 work from RingIn)
13. Boost ad billing (referenced in for-owners but no payment flow)
14. Refund policy page (referenced multiple times but not created)
15. Capacitor wrapper for true earpiece/loudspeaker call routing
    (mirror RingIn Phase 4)
