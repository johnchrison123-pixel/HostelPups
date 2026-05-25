# HostelPups — Claude Project Context

## ⚠️ WORKING RULES FROM OWNER (NON-NEGOTIABLE)

These rules override default Claude behavior. Read before every task.

1. **Log every instruction.** Every instruction the owner gives must be appended to the "Instructions History" section below, with date and verbatim text. Do this BEFORE executing the instruction.
2. **Estimate time first.** Before producing the full output of any prompt, give an approximate time estimate at the very top of the response (e.g., "~5 minutes"). Use these rough buckets:
   - **< 2 min** — single small file edit, quick fix, configuration tweak
   - **5–10 min** — feature work touching 3–5 files
   - **15–30 min** — multi-file feature with new components
   - **30+ min** — major build, migration, or multi-page work
3. **SEO is the prime directive.** Every page, every component, every URL must be SEO-friendly. This includes: semantic HTML, server-rendering by default, proper meta tags via `buildMetadata()`, JSON-LD structured data, fast Core Web Vitals, descriptive URLs, alt text on images, breadcrumb schema where applicable. See "SEO Standards" section for the full checklist.
4. **Never repeat a mistake from the Mistakes Log.** Before writing code, scan the "Mistakes Log — Do Not Repeat" section. If your planned approach matches a logged mistake, change course.

---

## 📋 Instructions History (running log)

| Date | Instruction (verbatim) |
|---|---|
| 2026-05-21 | "every instruction i give you you have to add it in claude.md file" |
| 2026-05-21 | "each prompt i give you and before giving the full output first you have to give me approximate time" |
| 2026-05-21 | "the whole project should SEO friendly" |
| 2026-05-21 | "do not make any repetitive mistakes which you already make" |
| 2026-05-21 | "give me clarification on Google Search Console + GA4 setup, and on npm run dev visual design feedback step" |
| 2026-05-21 | "CANT YOU MAKE IT IN VERCEL AND GITHUB ADD?" — push project to GitHub + deploy to Vercel for live preview |
| 2026-05-21 | GitHub repo URL provided: https://github.com/johnchrison123-pixel/HostelPups — push code + link Vercel for auto-deploys |
| 2026-05-21 | /loop — Research competitors (FindMyHostel, FineMeHostel, etc.) globally. Get inspired. Redesign landing + login. Run parallel agents. Second parallel agent: deep research + HTML report viewable on phone. Stop when done, wait for next command. |
| 2026-05-21 | "Add dummy profile cards + profiles of hostels/PGs/flats in each section (removable later). Confirm business owner + user registration features. Double-check with multiple agents that all functions are working." |
| 2026-05-21 | "There should be option to register for business in sign up section and in login section as login as business" — add prominent Renter/Business mode toggle on /signup, /login, /owner/signup, /owner/login |
| 2026-05-21 | "what all things has to be done by my side give me" — produce a complete prioritized founder action checklist |
| 2026-05-21 | (7 asks): (1) filter in left vacant section, (2) keep saved login data, (3) photos/profile/message/call data, (4) in-app call option, (5) block business from revealing phone numbers via obfuscation tricks (99five34, 9-99-78, etc), (6) find what's missing/not working, (7) for business: cover page, images, descriptions, vacancies, manage profiles |
| 2026-05-21 | "give me the codes here" — paste all 5 Supabase SQL files inline in chat for direct copy/paste (instead of GitHub navigation) |
| 2026-05-21 | (screenshots) — verification query confirms tables exist but all counts=0. Seed file didn't run. Paste seed inline. |
| 2026-05-21 | "done" — seed applied. Start Phase 1B: wire pages to Supabase queries + email magic-link auth + owner CRUD + photo upload to storage. |
| 2026-05-21 | 3 Photos/profile/message/call data storage + Keep saved login data + 4 In-app call option — start Phase 2 (chat module + WebRTC calling skeleton in parallel) |
| 2026-05-21 | /loop — find what works / what doesn't, fix everything fixable, double-check, audit all pages/profiles/options/features/functions, mark pending what needs user, fix what I can myself |
| 2026-05-21 | Reported live bug: magic link came from Supabase domain, click goes to localhost:3000. Both are Supabase dashboard config (not code). |
| 2026-05-21 | (screenshot) "email rate limit exceeded" — Supabase free tier 4 emails/hour limit hit. Two fixes: wait 1 hour OR wire custom SMTP via Resend (free 3K emails/month). |
| 2026-05-25 | (screenshot) "Error sending magic link email" — generic SMTP failure. Need to diagnose: Resend misconfigured? Sender domain rejected? Bad API key? |
| 2026-05-25 | "i forgot to add the api key as password" — root cause of magic-link error. Just paste API key into SMTP Password field. |
| 2026-05-25 | "still not working" — API key added but magic link still fails. Need Resend dashboard logs + SMTP screenshot to pinpoint. |
| 2026-05-25 | (screenshots) Supabase SMTP config looks correct on visible fields. Resend dashboard shows "No sent emails yet" — emails never reached Resend at all. Likely: Enable Custom SMTP toggle is OFF, or password didn't save. |
| 2026-05-25 | (screenshot) Toggle confirmed ON, all fields correct, Save Changes visible. Re-added API key. Still no emails in Resend. Need Auth Logs to diagnose. |
| 2026-05-25 | "Remove Resend option from beginning. Switch to login with phone number. Test dummy number and OTP like we used for RingIn app." — pivot from email magic-link to phone OTP using Supabase test phone numbers (bypasses SMS provider for testing). |
| 2026-05-25 | Rewrite LoginForm / SignupForm / OwnerSignupForm / AuthSidePanel to use Supabase phone OTP (signInWithOtp + verifyOtp). +91 prefix, 6-digit OTP, two-step (login) / three-step (signup) flows. Keep /auth/callback for future Google OAuth. |
| 2026-05-25 | "Switch to password auth. Signup form: name + email + phone + password + city + T&C tick. No phone verification for now — just create account + log in + redirect to home. Login: email OR phone + password. Same for business/owner." |
| 2026-05-25 | "is there any way to give you access to our supabase, vercel and resend so you can do everything yourself?" — yes, partial autonomy possible via API tokens. Document trade-offs + how. |
| 2026-05-25 | "will john@test.com work?" (login error screenshot) — no, Supabase rejects fake/test domains. Use a real email or Gmail alias. |
| 2026-05-25 | "find all bugs problems, features and functions that are not working. find all the issues across the app" — comprehensive audit + fix pass v2 (since password auth pivot) |
| 2026-05-25 | (screenshot — still trying john@test.com on /login) — repeat: use real Gmail address, not test.com. The "Looks good" hint only checks syntax, not whether domain is valid. |
| 2026-05-25 | "please we don't need an email to verify or confirm we just wanted to login to test our feature. so not giving public access now" — show how to create test users directly via Supabase Dashboard (bypasses signup validation). |
| 2026-05-25 | "no I wanted it in login page i don't want to do it in supabase. adjust the code for me. later we will make changes. easy login now without restrictions" — switch signup to use auth.admin.createUser server action (bypasses email validation, auto-confirms). |
| 2026-05-25 | "there should be options like calls messages saved" — add Messages/Calls/Saved/Profile links to Header user dropdown (currently only Dashboard + Logout). |

*New rule: append every future instruction to this table.*

---

## 🚫 Mistakes Log — Do Not Repeat

Real bugs I've already hit on this project. Don't make them again.

| # | Mistake | What happens | Fix / Don't do this |
|---|---|---|---|
| 1 | Imported brand icons (`Instagram`, `Facebook`, `Twitter`, `Youtube`, `Linkedin`) from `lucide-react` | Build fails — these exports were removed for trademark reasons | Use inline SVGs for social brand icons. See `src/components/layout/Footer.tsx` for the pattern. |
| 2 | Exported a const (`FAQ_ITEMS`) from a `"use client"` file and imported it into a server component | Runtime error at prerender: "X.map is not a function" — the const becomes a client reference, not the array | Keep data in plain `.ts` files (e.g., `src/lib/faq.ts`). Client components import from there. Server components also import from there. |
| 3 | Used `l.area` when type was `LodgingSchemaInput { address: { area?: string; ... } }` | TypeScript build fails — property doesn't exist at root | Match nested type structure exactly. Always check the type definition before accessing properties. |
| 4 | Used bash `cd "..." && cmd` with unescaped quotes inside double-quoted PowerShell args | "unexpected EOF while looking for matching quote" | Use PowerShell tool with `Set-Location` + `;` chain. Don't try to fake bash on Windows. |
| 5 | Tried to read a file that wasn't written yet (READMEme from create-next-app) | "File has not been read yet" — Write tool blocks overwrites of unread files | Always `Read` a file before `Write`-ing over it, even if you "know" what's in it. |
| 6 | Used `₹` rupee glyph in `.md` files written via Write tool with potential encoding issues | (Risk only) UTF-8 BOM mismatch could mangle special chars in Windows PowerShell | Prefer `Rs` over `₹` in `README.md` when uncertain. CLAUDE.md is fine to use the glyph. |

*New rule: when you hit a real, reproducible mistake, add a row here with the fix.*

---

## 🔍 SEO Standards (THE prime directive)

Every page must meet this checklist before being considered done.

### Server-side
- [ ] **Page is a server component** by default. Only use `"use client"` for interactive widgets, never whole pages.
- [ ] **`buildMetadata()`** called with title, description, path, keywords. Never hand-write `<title>` or `<meta name="description">`.
- [ ] **Canonical URL** set via `alternates.canonical` (handled by `buildMetadata`).
- [ ] **Open Graph + Twitter cards** populated (handled by `buildMetadata`).
- [ ] **JSON-LD structured data** appropriate to page:
  - All pages: rely on root `Organization` + `WebSite` schema (in `app/layout.tsx`)
  - Listing pages: `LodgingBusiness` + `BreadcrumbList`
  - FAQ-bearing pages: `FAQPage`
  - City pages: `BreadcrumbList`
- [ ] Page route added to `src/app/sitemap.ts` if new.

### Markup
- [ ] **Exactly one `<h1>`** per page — the main keyword-rich headline.
- [ ] **Heading hierarchy preserved** (`h1` → `h2` → `h3`, no skipping).
- [ ] **All images use `next/image`** with `alt` text describing the actual content.
- [ ] **Semantic HTML** — `<section>`, `<article>`, `<nav>`, `<aside>`, `<main>` where appropriate.
- [ ] **`lang="en"`** on `<html>` (set in root layout).

### URL design
- [ ] URL contains target keyword (e.g., `/pg-in-kochi`, not `/listings/123`).
- [ ] Hyphens, not underscores, in slugs.
- [ ] Lowercase only.
- [ ] No trailing slash (set in `next.config.ts`).
- [ ] No query strings for canonical landing pages — use path segments.

### Performance
- [ ] Lighthouse Performance ≥ 90 on mobile.
- [ ] LCP < 2.5s, CLS < 0.1, INP < 200ms.
- [ ] Next.js `<Image>` for everything (AVIF/WebP, lazy load default, responsive sizes).
- [ ] Font: `display: swap` on Plus Jakarta Sans (already configured).
- [ ] No client-side data fetching for above-the-fold content — use server components / `generateStaticParams`.

### Content
- [ ] Each page has min 300 unique words of original copy (city + wedge pages already hit this).
- [ ] Target keyword appears in: H1, first 100 words, meta description, URL, image alt (≥ 1).
- [ ] Internal links to ≥ 3 related pages (cities link to wedge pages, wedge pages link to city pages, etc.).
- [ ] External authoritative link where natural (e.g., Wikipedia for cities, govt sites for KYC).

### Discoverability
- [ ] Page reachable from homepage in ≤ 3 clicks.
- [ ] Page appears in `sitemap.xml`.
- [ ] Page not blocked in `robots.ts` unless it's user-private (login, dashboards).

---

## Project Info
- **App Name:** HostelPups
- **Tagline:** India's most trusted PG, hostel & flat marketplace
- **Live URL:** TBD (planned: https://hostelpups.in and https://hostelpups.com)
- **Local Path:** C:\Users\johnc\Desktop\HostelPups\hostelpups
- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Supabase + Vercel
- **Founded:** Kochi, Kerala — expanding pan-India

## Business Model (REQUIRED CONTEXT — read before touching pricing/features)

### Two-tier owner onboarding
1. **Full-service** (Kochi, Bangalore, Chennai)
   - ₹1,999 first year, ₹999/year renewal
   - HostelPups team does in-person KYC + professional photoshoot
   - Photo IP belongs to platform (anti-disintermediation)
   - Unlimited listings
2. **Self-serve** (everywhere else, including rest of Kerala)
   - ₹999/year recurring
   - Owner uploads own photos (must follow quality rules)
   - Max 3 active listings
   - Verification badge optional: ₹799/year (video call + live location + Google research)

### User pricing (one-time, NOT subscription — PG hunting is one-shot use)
- ₹99 / week — unlimited owner contact unlocks
- ₹199 / month
- ₹499 / year
- ₹29 single-contact unlock (impulse buy)

### Boost (separate add-on)
- ₹99/day, ₹499/week, ₹1,499/month — top of search

### Year 1 financial plan (Kochi + Bangalore + Chennai + Kerala self-serve + pan-India self-serve)
- Starting capital: ₹10 lakh from sleeping partner (20% equity)
- Year 1 revenue projection: ₹78.65 lakh
- Year 1 cost: ₹58.32 lakh
- Year 1 net: ~₹19-22 lakh (fully reinvested)
- Lowest cash point: ₹8.25 lakh (Month 2)
- Cash at year-end: ~₹30 lakh
- Team: 2 sales reps Kochi + 3 telecallers (1 existing + 2 new) + 1 photographer + 1 marketing manager + verification specialist (M3) + Bangalore rep (M7) + Chennai rep (M10)

### Critical strategic moves
- **3 telecallers cold-call hostels across India** to drive self-serve registrations
- **Bangalore launches M7, Chennai M10** — 1 sales rep + freelance photographer each
- **Wedge positioning**: couple-friendly, bachelor-friendly, pet-friendly, student-friendly — Front-and-center, not buried filters
- **No payment integration in V1** — defer to V2 to skip Razorpay friction. Users pay deposit to owner directly (Indian PG culture is visit-first, cash/UPI)

## Tech Stack Decisions
- **Next.js 16 App Router** — SSR for SEO (critical — Google traffic is #1 acquisition)
- **TypeScript** — type safety, better autocompletion
- **Tailwind CSS 4** — CSS-first config in globals.css, no tailwind.config.ts
- **Supabase** — auth, DB, storage, realtime (shared client in `src/lib/supabase.ts`)
- **Plus Jakarta Sans** — display + body font (modern, friendly, India-appropriate)
- **Vercel** — deployment target, auto-deploys from main
- **lucide-react** — icons (tree-shakeable)
- **clsx + tailwind-merge** — `cn()` utility for class merging
- **Capacitor** — to be added in Phase 2/3 for Android wrapper (push notifications, app store presence)

## Coding Rules (HostelPups, NOT RingIn)
- **Standard JSX** — not React.createElement (different from RingIn). Next.js ecosystem assumes JSX.
- **TypeScript everywhere** — `.tsx` for components, `.ts` for utilities
- **Server components by default** — only use `"use client"` when needed (interactivity, hooks)
- **No `any` types** — use proper types from `src/lib/types.ts`
- **All metadata via `buildMetadata()`** — never hand-write `<head>` tags
- **All prices via `PRICING` constant** in `src/lib/site.ts` — single source of truth
- **All city names via `CITY_NAMES`** — no hand-typed display names
- **`cn()` for conditional classes** — never string concatenation
- **Tailwind 4 syntax** — `bg-[var(--color-brand-500)]` for CSS variable colors

## File Organization
```
hostelpups/
  src/
    app/
      layout.tsx              # Root layout with Header/Footer/MobileNav
      page.tsx                # Landing page
      globals.css             # Theme tokens (Tailwind 4 @theme)
      sitemap.ts              # Auto sitemap
      robots.ts               # robots.txt
      about/, contact/, faq/, privacy/, terms/        # Static marketing
      how-it-works/, for-owners/
      pg-in-{city}/           # Static city landings (6 cities)
      pg/[city]/[slug]/       # Dynamic listing detail
      couple-friendly-pg/[city]/   # Wedge pages (3 wedges × 6 cities)
      bachelor-friendly-pg/[city]/
      pet-friendly-pg/[city]/
      search/                 # Search page
      login/, signup/         # User auth
      owner/login/, owner/signup/   # Owner auth
    components/
      ui/                     # Button, Badge, Card, Container
      layout/                 # Header, Footer, MobileBottomNav
      marketing/              # Hero, HowItWorks, WedgeFeatures, CityGrid,
                              # OwnerCTA, PricingSection, FaqSection,
                              # CityLanding, WedgeLanding
    lib/
      site.ts                 # SITE constants, PRICING, CITY_NAMES, WEDGE_TAGS
      seo.ts                  # buildMetadata, schema helpers (Organization,
                              # Website, LodgingBusiness, Breadcrumb, FAQ)
      types.ts                # Shared TypeScript types
      utils.ts                # cn, slugify, formatPrice, redactContactInfo, timeAgo
      supabase.ts             # Shared Supabase client (sb)
  public/
    manifest.webmanifest      # PWA manifest
```

## Design System
- **Primary yellow:** `--color-brand-500` (#F0B429)
- **Off-white background:** `--color-bg` (#FFFCF5)
- **Pink CTA accent:** `--color-cta` (#E91E63) — for "Pay", "Contact", "Sign Up Now"
- **Success green:** `--color-success` (#10B981) — verified badges
- **Wedge color tokens** for couple (pink), bachelor (indigo), pet (teal), student (amber)
- **Border radius scale:** `--radius-sm`, `--radius`, `--radius-lg`, `--radius-xl`, `--radius-full`
- **Shadows:** subtle, brand-tinted (warm yellow undertone)

## SEO Strategy
- **Static generation** for all city + wedge + marketing pages — instant Google indexing
- **Server-rendered** listing detail pages — populated in Phase 1 from Supabase
- **JSON-LD schemas** baked in: `Organization`, `WebSite`, `LodgingBusiness`, `BreadcrumbList`, `FAQPage`
- **URL structure for keyword ranking:**
  - `/pg-in-kochi` — city landings (concatenated for SEO)
  - `/pg/kochi/listing-slug` — individual listings
  - `/couple-friendly-pg/kochi` — wedge pages (specifically rank for these queries)
  - `/bachelor-friendly-pg/kochi`, `/pet-friendly-pg/kochi`
- **Sitemap auto-generates** all city + wedge + static URLs
- **Open Graph + Twitter cards** on every page via `buildMetadata()`

## Phase Roadmap
- **Phase 0 (DONE — current state):** Foundation, landing page, marketing pages, SEO infrastructure, routing skeleton, placeholder auth/listing pages
- **Phase 1 (NEXT):** Supabase schema, real auth (phone OTP), owner listing CRUD, real search + filters, listing detail with photos
- **Phase 2:** Razorpay payments, in-app chat with auto-redaction, owner dashboard with stats + boost, KYC verification flow
- **Phase 3:** Admin panel, automated email/SMS notifications, renewal reminders, refund handling, mobile app via Capacitor

## Database Migrations — Expand-Contract Pattern (CRITICAL)
Same rules as RingIn:
- Every schema change MUST be backward-compatible OR forward-compatible, NEVER both at once
- Use Supabase CLI migrations in `supabase/migrations/NNNN_name.sql`
- Client code should assume column "may not exist yet" (use try/catch with `.from(...).select(...)`)
- Never rename a column in-place — add new, backfill, switch reads, drop old

## Anti-Disintermediation Rules (CRITICAL)
Every chat message must pass through `redactContactInfo()` in `src/lib/utils.ts`. Blocks:
- Indian mobile numbers (10 digits, +91/0 prefix optional)
- Email addresses
- UPI IDs (@paytm, @okhdfcbank, etc.)
- WhatsApp/Telegram links
- Common phrases ("call me at...", "WhatsApp me", "DM me")

Strike system in chat:
- 2 violations → soft warning toast
- 3 violations → owner suspended for 7 days
- 5 violations → permanent ban without refund

## Pricing — Single Source of Truth
All prices live in `PRICING` constant in `src/lib/site.ts`. Never hardcode rupee amounts in components — import from there.

## Deployment

### Live URLs
- **Production:** https://hostelpups.vercel.app
- **GitHub:** https://github.com/johnchrison123-pixel/HostelPups
- **Vercel dashboard:** https://vercel.com/johnchrison123-pixels-projects/hostelpups
- **Vercel scope:** `johnchrison123-pixels-projects`
- **Branch:** `main` (auto-deploys to production)

### Workflow — how to deploy a change
```powershell
cd "C:\Users\johnc\Desktop\HostelPups\hostelpups"
# 1. Make code changes
# 2. Test locally if needed: npm run dev
# 3. Verify build: npm run build
git add .
git commit -m "feat: <short description of what changed>"
git push origin main
# 4. Vercel auto-deploys in ~1-2 minutes. Watch progress at the dashboard URL above.
```

### Commit message style
Follow conventional commits (consistent with RingIn):
- `feat: ` — new feature or page
- `fix: ` — bug fix
- `refactor: ` — code refactor with no behavior change
- `style: ` — visual/CSS only
- `docs: ` — documentation
- `chore: ` — config, deps, tooling
- `seo: ` — SEO-specific change (meta, schema, sitemap, etc.)

### Pre-launch checklist
- [ ] Buy both domains: `hostelpups.in` (primary) + `hostelpups.com` (redirect)
- [ ] Add custom domains in Vercel dashboard → Settings → Domains
- [ ] Set up Google Search Console (DNS TXT verification for both domains)
- [ ] Set up Google Analytics 4 + add `G-XXXXXXXXXX` to `.env.local` as `NEXT_PUBLIC_GA_ID`
- [ ] Submit sitemap.xml to Google Search Console
- [ ] Set up Supabase project + add keys to Vercel env vars (Project Settings → Environment Variables)
- [ ] Set up Razorpay account + add keys to Vercel env vars
- [ ] Set up MSG91 + add keys

### Environment variables — where they live
- **Local development:** `.env.local` (gitignored, never committed)
- **Production:** Vercel dashboard → Project → Settings → Environment Variables
- Variables prefixed `NEXT_PUBLIC_` are exposed to the browser. Everything else is server-only.

## Key Decisions to Confirm Before Phase 1
1. ✅ **Stack:** Next.js + TypeScript + Tailwind 4 + Supabase
2. ✅ **Project location:** `~/Desktop/HostelPups/hostelpups/`
3. ✅ **Domain:** both `.in` + `.com`
4. ✅ **Coding style:** Standard JSX + TypeScript
5. ✅ **Theme:** Yellow + off-white
6. ✅ **₹1,999 first year + ₹999/year renewal** for full-service tier
7. ✅ **3 active listings limit** for self-serve (NOT 3/month)
8. ⏳ **Auto-renewal via Razorpay UPI mandate** — confirm in Phase 2
