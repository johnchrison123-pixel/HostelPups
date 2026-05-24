import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/site";

// Inline SVG social icons (lucide-react removed brand icons due to trademarks)
const SocialIcon = {
  Instagram: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  Facebook: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  Twitter: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  Youtube: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  ),
  Linkedin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
};

const cols = [
  {
    title: "For Renters",
    links: [
      { href: "/search", label: "Search PGs" },
      { href: "/couple-friendly-pg/kochi", label: "Couple-Friendly" },
      { href: "/bachelor-friendly-pg/kochi", label: "Bachelor-Friendly" },
      { href: "/pet-friendly-pg/kochi", label: "Pet-Friendly" },
      { href: "/how-it-works", label: "How It Works" },
    ],
  },
  {
    title: "For Owners",
    links: [
      { href: "/for-owners", label: "List Your Property" },
      { href: "/for-owners#full-service", label: "Full-Service Plan" },
      { href: "/for-owners#self-serve", label: "Self-Serve Plan" },
      { href: "/for-owners#verification", label: "Verification Badge" },
      { href: "/owner/login", label: "Owner Login" },
    ],
  },
  {
    title: "Cities",
    links: [
      { href: "/pg-in-kochi", label: "PG in Kochi" },
      { href: "/pg-in-bangalore", label: "PG in Bangalore" },
      { href: "/pg-in-chennai", label: "PG in Chennai" },
      { href: "/pg-in-trivandrum", label: "PG in Trivandrum" },
      { href: "/pg-in-calicut", label: "PG in Calicut" },
      { href: "/pg-in-trichur", label: "PG in Trichur" },
      { href: "/cities", label: "View all cities" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQ" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

const socials = [
  { Icon: SocialIcon.Instagram, href: SITE.social.instagram, label: "Instagram" },
  { Icon: SocialIcon.Facebook, href: SITE.social.facebook, label: "Facebook" },
  { Icon: SocialIcon.Twitter, href: SITE.social.twitter, label: "Twitter" },
  { Icon: SocialIcon.Youtube, href: SITE.social.youtube, label: "YouTube" },
  { Icon: SocialIcon.Linkedin, href: SITE.social.linkedin, label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <Container size="xl">
        <div className="py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand col */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-500)] text-[var(--color-ink)] font-black">
                HP
              </span>
              HostelPups
            </Link>
            <p className="mt-3 text-sm text-[var(--color-ink-muted)] leading-relaxed">
              India&apos;s most trusted marketplace for PGs, hostels, and rental flats.
              Verified owners. No brokers. No hidden fees.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {socials.map((s) => {
                const Icon = s.Icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-100)] transition-colors"
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link cols */}
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="font-semibold text-sm mb-4">{col.title}</h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-brand-700)] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-ink-subtle)]">
            © {new Date().getFullYear()} HostelPups. All rights reserved. Made in
            Kochi, India.
          </p>
          <p className="text-xs text-[var(--color-ink-subtle)]">
            Questions? Email{" "}
            <a
              href={`mailto:${SITE.supportEmail}`}
              className="text-[var(--color-brand-700)] hover:underline"
            >
              {SITE.supportEmail}
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
