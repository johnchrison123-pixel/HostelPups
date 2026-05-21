# HostelPups

India's most trusted PG, hostel, and flat marketplace. Built for the renters every other platform ignores — couples, bachelors, students, and pet owners.

## Stack
- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** (CSS-first config)
- **Supabase** (auth, DB, storage, realtime)
- **Vercel** (deployment)
- **Plus Jakarta Sans** display font

## Getting started

```bash
cd hostelpups
npm install
cp .env.local.example .env.local      # then fill in Supabase + other keys
npm run dev                            # http://localhost:3000
```

## Useful scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint
```

## Project structure
See `CLAUDE.md` for detailed architecture, design system, and business context.

## Phase 0 (current)
- Next.js 16 + TypeScript + Tailwind 4 scaffold
- Yellow + off-white theme (CSS variables, Tailwind 4 `@theme`)
- Landing page (Hero, HowItWorks, WedgeFeatures, CityGrid, Pricing, OwnerCTA, FAQ)
- Marketing pages (about, how-it-works, for-owners, contact, FAQ, privacy, terms)
- City landing pages (Kochi, Bangalore, Chennai, Trivandrum, Calicut, Trichur)
- Wedge pages (couple-friendly, bachelor-friendly, pet-friendly x 6 cities)
- Listing detail placeholder (`/pg/[city]/[slug]`)
- Auth pages (user + owner login + signup)
- SEO foundation (sitemap, robots, JSON-LD, Open Graph)
- PWA manifest

## Phase 1 (next)
- Supabase schema (profiles, owners, listings, photos, amenities, inquiries, messages, payments)
- Phone OTP auth (Supabase Auth)
- Owner listing CRUD with photo upload
- Real search with filters (city, area, gender, budget, AC, food, sharing)
- Listing detail page with real data + photos

## Phase 2
- Razorpay payment integration
- In-app chat with auto-redaction + strike system
- Owner dashboard (inquiries, stats, boost purchase, vacancy toggle)
- KYC + verification flow

## Phase 3
- Admin panel
- Email + SMS notifications (MSG91)
- Auto-renewal flow
- Capacitor Android wrapper for app store presence

## Business model summary

### Owner pricing
- **Full-service** (Kochi, Bangalore, Chennai): Rs 1,999 first year + Rs 999/year renewal — includes photoshoot, KYC, in-person verification
- **Self-serve** (other cities): Rs 999/year recurring — max 3 active listings, optional Rs 799/year verification badge
- **Boost**: Rs 99/day, Rs 499/week, Rs 1,499/month

### Renter pricing (one-time, not subscription)
- Rs 99 / week
- Rs 199 / month
- Rs 499 / year
- Rs 29 single contact unlock

### Year-1 projection
- Rs 10L capital from sleeping partner (20% equity)
- Rs 78.6L gross revenue
- Rs 19-22L net profit (fully reinvested into Bangalore/Chennai expansion)

See `CLAUDE.md` for full context.
