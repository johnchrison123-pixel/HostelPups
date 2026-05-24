import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageSquare,
  Lock,
  ShieldCheck,
  CircleDot,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { buildMetadata } from "@/lib/seo";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Inquiries",
  description: "All renter inquiries on your HostelPups listings.",
  path: "/owner/inquiries",
  noindex: true,
});

interface InquiryRow {
  id: string;
  user: string;
  listing: string;
  city: string;
  preview: string;
  isoDate: string;
  status: "open" | "responded" | "closed";
}

// PENDING (Phase 1B): replace with select from public.inquiries join messages join listings
const PLACEHOLDER_INQUIRIES: InquiryRow[] = [
  {
    id: "i_001",
    user: "Aditya Menon",
    listing: "Sunshine PG",
    city: "Kochi",
    preview: "Hi, is the single AC room still available for May start?",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    status: "open",
  },
  {
    id: "i_002",
    user: "Priya Nair",
    listing: "Techie Nest PG",
    city: "Kochi",
    preview: "Looking for a 3-month stay for Infopark internship. Meals included?",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    status: "responded",
  },
  {
    id: "i_003",
    user: "Rahul Sharma",
    listing: "Casa Cozy Couple Studio",
    city: "Kochi",
    preview: "Pet-friendly? We have a small indie dog. Society allows?",
    isoDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: "open",
  },
  {
    id: "i_004",
    user: "Sneha Iyer",
    listing: "Greenview Boys Hostel",
    city: "Kochi",
    preview: "Thanks for the reply — moving in next Monday.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    status: "closed",
  },
];

const STATUS_TONE: Record<InquiryRow["status"], "warning" | "verified" | "default"> = {
  open: "warning",
  responded: "verified",
  closed: "default",
};

const STATUS_LABEL: Record<InquiryRow["status"], string> = {
  open: "Open",
  responded: "Replied",
  closed: "Closed",
};

export default function OwnerInquiriesPage() {
  return (
    <OwnerLayout>
      <header className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Inquiries</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Renters reach you through HostelPups secure chat. Reply within 4 hours to keep
          your response rate badge.
        </p>
      </header>

      {/* Safety notice */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-6 flex items-start gap-3 text-sm">
        <ShieldCheck size={18} className="text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">Inquiries are routed through HostelPups secure chat.</p>
          <p className="text-[var(--color-ink-muted)] mt-0.5">
            Direct phone numbers, emails, UPI IDs, and social handles are <strong>never shared</strong>
            in either direction. Trying to share them in chat triggers our anti-disintermediation
            filter and may suspend your account.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden shadow-[var(--shadow-sm)]">
        <ul role="list" className="divide-y divide-[var(--color-border)]">
          {PLACEHOLDER_INQUIRIES.map((row) => (
            <li
              key={row.id}
              className="p-4 sm:p-5 hover:bg-[var(--color-surface)] transition-colors"
            >
              <div className="flex items-start gap-3">
                {row.status === "open" ? (
                  <CircleDot size={14} className="text-amber-600 mt-1.5 shrink-0" aria-label="Open inquiry" />
                ) : (
                  <span className="h-3.5 w-3.5 mt-1.5 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[var(--color-ink)] truncate">{row.user}</p>
                    <span className="text-xs text-[var(--color-ink-subtle)]">
                      · {row.listing}, {row.city}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-2 shrink-0">
                      <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                      <span className="text-xs text-[var(--color-ink-muted)] hidden sm:inline">
                        {timeAgo(row.isoDate)}
                      </span>
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-[var(--color-ink-muted)] line-clamp-2">
                    {row.preview}
                  </p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Link
                      href="/messages"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brand-500)] bg-[var(--color-brand-50)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)] transition-colors"
                    >
                      <MessageSquare size={12} aria-hidden="true" />
                      Open chat
                    </Link>
                    <span className="text-[10px] text-[var(--color-ink-subtle)] inline-flex items-center gap-1">
                      <Lock size={9} aria-hidden="true" />
                      Phone numbers hidden by HostelPups
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[11px] uppercase tracking-wider font-bold text-amber-700">
        Pending Phase 1B — real-time inquiry query
      </p>
    </OwnerLayout>
  );
}
