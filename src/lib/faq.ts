/**
 * FAQ content — separated from FaqSection.tsx (which is "use client")
 * so server components can import this without React Server Components
 * treating it as a client reference.
 */

export const FAQ_ITEMS = [
  {
    q: "How is HostelPups different from JustDial or NoBroker?",
    a: "We focus only on PGs, hostels, and rental flats — and we verify every owner via video call + Aadhaar + live location. JustDial is a phone book; NoBroker is generic. HostelPups specifically serves couples, bachelors, students, and pet owners who get rejected elsewhere.",
  },
  {
    q: "What does the ₹99 actually unlock?",
    a: "₹99 gives you 7 days of unlimited access to unlock owner contacts and chat with any number of hostel/PG owners. ₹199 gives you 30 days. ₹499 gives you a full year. Pay once, no recurring charges.",
  },
  {
    q: "How do I know listings are real?",
    a: "Every owner on HostelPups completes a KYC process — government ID + video call + live location check. Look for the green verified badge. We also watermark all photos and ban owners who try to push users off-platform.",
  },
  {
    q: "Why should I pay when I can find owners' numbers on Google?",
    a: "Because most owner contact info on Google is from brokers or scrapers — not verified. With HostelPups you talk to KYC-verified owners directly. Plus our visit-protection guarantee means we refund your platform fee if the PG is materially different from its listing when you visit.",
  },
  {
    q: "Are there any broker fees?",
    a: "Never. Zero. We don't take a commission on rent. You pay ₹99-499 for platform access, and that's it — directly to HostelPups, not to any agent.",
  },
  {
    q: "Can couples or pet owners really find PGs here?",
    a: "Yes — that's exactly who we built HostelPups for. Owners explicitly tag their listings as couple-friendly, bachelor-friendly, or pet-friendly during signup. We filter out the ones that aren't, so you never face awkward rejections.",
  },
  {
    q: "What if I don't like the PG after visiting?",
    a: "No commitment until you sign a rental agreement directly with the owner. HostelPups doesn't lock you in. If you booked through our verified visit feature and the PG is materially different from photos/description, we offer a refund of your platform fee.",
  },
  {
    q: "I'm a PG owner — what does it cost to list?",
    a: "₹1,999 one-time for full-service (includes professional photoshoot + KYC + verification + listing setup) in Kochi, Bangalore, Chennai. ₹999/year self-serve for other cities (you upload your own photos, max 3 active listings). Optional ₹799/year verification badge.",
  },
];
