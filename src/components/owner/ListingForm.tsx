"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Camera,
  Bed,
  Sparkles,
  Tag,
  Plus,
  Trash2,
  Save,
  Send,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  PROPERTY_TYPES,
  CITY_NAMES,
  KERALA_CITIES,
  FULL_SERVICE_CITIES,
  WEDGE_TAGS,
} from "@/lib/site";
import type { GenderPreference, PropertyType, WedgeTag } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PhotoUploader, type UploaderPhoto } from "./PhotoUploader";

type Step = "basics" | "photos" | "rooms" | "amenities" | "tags";

const STEPS: { key: Step; label: string }[] = [
  { key: "basics", label: "Basics" },
  { key: "photos", label: "Photos" },
  { key: "rooms", label: "Rooms" },
  { key: "amenities", label: "Amenities" },
  { key: "tags", label: "Tags" },
];

const ALL_CITIES = Array.from(
  new Set([...KERALA_CITIES, ...FULL_SERVICE_CITIES]),
);

interface RoomRow {
  id: string;
  name: string;
  price: string;
  ac: boolean;
  occupancy: string;
  vacancies: string;
}

interface ListingFormData {
  // basics
  title: string;
  type: PropertyType;
  city: string;
  area: string;
  landmark: string;
  description: string;
  // rooms
  rooms: RoomRow[];
  // amenities
  amenities: Set<string>;
  rules: string;
  // tags
  gender_pref: GenderPreference;
  wedge_tags: Set<WedgeTag>;
}

const AMENITY_OPTIONS: { key: string; label: string }[] = [
  { key: "wifi", label: "Wi-Fi" },
  { key: "food", label: "Meals" },
  { key: "laundry", label: "Laundry" },
  { key: "ac", label: "AC rooms" },
  { key: "gym", label: "Gym" },
  { key: "parking", label: "Parking" },
  { key: "hot_water", label: "Hot water" },
  { key: "security", label: "24/7 security" },
  { key: "housekeeping", label: "Housekeeping" },
  { key: "study_room", label: "Study room" },
  { key: "common_kitchen", label: "Common kitchen" },
  { key: "balcony", label: "Balcony" },
  { key: "power_backup", label: "Power backup" },
  { key: "terrace_access", label: "Terrace access" },
];

const GENDER_OPTIONS: { value: GenderPreference; label: string }[] = [
  { value: "any", label: "Co-living (any)" },
  { value: "men", label: "Men only" },
  { value: "women", label: "Women only" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
];

function makeBlankRoom(idx: number): RoomRow {
  return {
    id: `row_${Date.now()}_${idx}`,
    name: "",
    price: "",
    ac: false,
    occupancy: "1",
    vacancies: "0",
  };
}

interface ListingFormProps {
  mode: "new" | "edit";
  initial?: Partial<ListingFormData>;
  /** When editing, the placeholder listing id (passed back to console.log) */
  listingId?: string;
}

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol
      className="flex items-center justify-center gap-2 flex-wrap"
      aria-label="Listing creation progress"
    >
      {STEPS.map((s, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <React.Fragment key={s.key}>
            <li
              className="flex items-center gap-1.5 text-xs sm:text-sm"
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                  isDone && "bg-[var(--color-success)] text-white",
                  isActive &&
                    "bg-[var(--color-brand-500)] text-[var(--color-ink)] ring-4 ring-[var(--color-brand-100)]",
                  !isDone &&
                    !isActive &&
                    "bg-[var(--color-surface)] text-[var(--color-ink-subtle)] border border-[var(--color-border-strong)]",
                )}
                aria-hidden="true"
              >
                {isDone ? <CheckCircle2 size={12} /> : i + 1}
              </span>
              <span
                className={cn(
                  "font-medium hidden sm:inline",
                  isActive
                    ? "text-[var(--color-ink)]"
                    : "text-[var(--color-ink-muted)]",
                )}
              >
                {s.label}
              </span>
            </li>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-3 sm:w-6",
                  isDone
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-border-strong)]",
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

export function ListingForm({ mode, initial, listingId }: ListingFormProps) {
  const router = useRouter();

  const [step, setStep] = React.useState<Step>("basics");
  const [submitting, setSubmitting] = React.useState<"draft" | "submit" | null>(
    null,
  );
  const [showSuccess, setShowSuccess] = React.useState<
    "draft" | "submit" | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);

  const [data, setData] = React.useState<ListingFormData>(() => ({
    title: initial?.title ?? "",
    type: initial?.type ?? "pg",
    city: initial?.city ?? "",
    area: initial?.area ?? "",
    landmark: initial?.landmark ?? "",
    description: initial?.description ?? "",
    rooms: initial?.rooms ?? [makeBlankRoom(0)],
    amenities: new Set(initial?.amenities ?? []),
    rules: initial?.rules ?? "",
    gender_pref: initial?.gender_pref ?? "any",
    wedge_tags: new Set(initial?.wedge_tags ?? []),
  }));

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;

  function update<K extends keyof ListingFormData>(
    key: K,
    value: ListingFormData[K],
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function validateBasics(): string | null {
    if (data.title.trim().length < 3)
      return "Listing title must be at least 3 characters.";
    if (!data.city) return "Pick the city of your property.";
    if (!data.area.trim()) return "Add the area / neighbourhood.";
    return null;
  }

  function next() {
    setError(null);
    if (step === "basics") {
      const err = validateBasics();
      if (err) return setError(err);
    }
    const nextIdx = Math.min(STEPS.length - 1, stepIdx + 1);
    setStep(STEPS[nextIdx].key);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError(null);
    const prevIdx = Math.max(0, stepIdx - 1);
    setStep(STEPS[prevIdx].key);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSave(intent: "draft" | "submit") {
    setError(null);
    const err = validateBasics();
    if (err) {
      setError(err);
      setStep("basics");
      return;
    }
    setSubmitting(intent);
    // PENDING: wire to Supabase insert into public.listings + room_types + listing_photos
    // PENDING: photo uploads to Supabase Storage `listing-photos` bucket
    // For now we just simulate
    window.setTimeout(() => {
      setSubmitting(null);
      setShowSuccess(intent);
      // eslint-disable-next-line no-console
      console.log("[ListingForm] PENDING submit:", {
        mode,
        listingId,
        intent,
        data: {
          ...data,
          amenities: Array.from(data.amenities),
          wedge_tags: Array.from(data.wedge_tags),
        },
      });
    }, 700);
  }

  /* ---------------------------- */
  /* Success state                */
  /* ---------------------------- */
  if (showSuccess) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={32} className="text-[var(--color-success)]" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight">
          {showSuccess === "draft"
            ? "Draft saved"
            : mode === "edit"
              ? "Changes saved"
              : "Listing submitted for review"}
        </h2>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          {showSuccess === "draft"
            ? "Come back any time to keep editing — only published listings count toward your active limit."
            : "Our team reviews new listings within 24 hours. You'll get an email when it goes live."}
        </p>
        <p className="mt-3 text-[10px] uppercase tracking-wider font-bold text-amber-700">
          PENDING — Supabase write wiring lands in Phase 1B
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <Button href="/owner/listings" variant="cta">
            Back to my listings
          </Button>
          <Button href="/owner/dashboard" variant="outline">
            Owner dashboard
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------------------- */
  /* Render                       */
  /* ---------------------------- */

  return (
    <div className="space-y-6">
      <StepIndicator current={step} />

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-sm)]">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* ============= STEP 1: BASICS ============= */}
        {step === "basics" && (
          <section aria-labelledby="basics-heading" className="space-y-5">
            <header>
              <h2 id="basics-heading" className="text-xl font-black">
                Property basics
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                What is it, where is it. We use this to match renters and to write your URL.
              </p>
            </header>

            <div>
              <label
                htmlFor="lf-title"
                className="block text-sm font-semibold mb-1.5"
              >
                Listing title
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <Building2
                  size={16}
                  className="text-[var(--color-ink-subtle)]"
                  aria-hidden="true"
                />
                <input
                  id="lf-title"
                  type="text"
                  value={data.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Sunshine PG Edappally"
                  className="flex-1 bg-transparent outline-none text-base"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="lf-type"
                className="block text-sm font-semibold mb-1.5"
              >
                Property type
              </label>
              <select
                id="lf-type"
                value={data.type}
                onChange={(e) => update("type", e.target.value as PropertyType)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
              >
                {Object.entries(PROPERTY_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="lf-city"
                  className="block text-sm font-semibold mb-1.5"
                >
                  City
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                  <MapPin
                    size={16}
                    className="text-[var(--color-ink-subtle)]"
                    aria-hidden="true"
                  />
                  <select
                    id="lf-city"
                    value={data.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="flex-1 bg-transparent outline-none text-base appearance-none"
                  >
                    <option value="">Select a city</option>
                    {ALL_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {CITY_NAMES[c] ?? c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="lf-area"
                  className="block text-sm font-semibold mb-1.5"
                >
                  Area / neighbourhood
                </label>
                <input
                  id="lf-area"
                  type="text"
                  value={data.area}
                  onChange={(e) => update("area", e.target.value)}
                  placeholder="Edappally"
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="lf-landmark"
                className="block text-sm font-semibold mb-1.5"
              >
                Nearby landmark (optional)
              </label>
              <input
                id="lf-landmark"
                type="text"
                value={data.landmark}
                onChange={(e) => update("landmark", e.target.value)}
                placeholder="Lulu Mall, Infopark, Metro station..."
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
              />
            </div>

            <div>
              <label
                htmlFor="lf-description"
                className="block text-sm font-semibold mb-1.5"
              >
                Description
              </label>
              <textarea
                id="lf-description"
                value={data.description}
                onChange={(e) => update("description", e.target.value)}
                rows={5}
                placeholder="What makes this place worth living in? Mention nearby commute, food, vibe — keep it honest."
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-3 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)] resize-y"
              />
              <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                Aim for 50-300 words. SEO loves real, specific descriptions over keyword spam.
              </p>
            </div>
          </section>
        )}

        {/* ============= STEP 2: PHOTOS ============= */}
        {step === "photos" && (
          <section aria-labelledby="photos-heading" className="space-y-4">
            <header>
              <h2 id="photos-heading" className="text-xl font-black flex items-center gap-2">
                <Camera size={20} className="text-[var(--color-brand-700)]" aria-hidden="true" />
                Property photos
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                Bright, natural-light photos rent rooms fastest. Include the exterior, common
                area, and at least one shot per room type.
              </p>
            </header>
            <PhotoUploader maxPhotos={10} />
          </section>
        )}

        {/* ============= STEP 3: ROOMS ============= */}
        {step === "rooms" && (
          <section aria-labelledby="rooms-heading" className="space-y-4">
            <header>
              <h2 id="rooms-heading" className="text-xl font-black flex items-center gap-2">
                <Bed size={20} className="text-[var(--color-brand-700)]" aria-hidden="true" />
                Rooms &amp; pricing
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                Add every room type you have. Renters filter by price and occupancy, so be specific.
              </p>
            </header>

            <ul className="space-y-3" role="list">
              {data.rooms.map((row, idx) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-end">
                    <div>
                      <label
                        htmlFor={`${row.id}-name`}
                        className="block text-xs font-semibold mb-1"
                      >
                        Room type
                      </label>
                      <input
                        id={`${row.id}-name`}
                        type="text"
                        value={row.name}
                        onChange={(e) => {
                          const next = [...data.rooms];
                          next[idx] = { ...row, name: e.target.value };
                          update("rooms", next);
                        }}
                        placeholder="Single AC / Double sharing"
                        className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 h-10 text-sm outline-none focus:border-[var(--color-brand-500)]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`${row.id}-price`}
                        className="block text-xs font-semibold mb-1"
                      >
                        Rs / month
                      </label>
                      <input
                        id={`${row.id}-price`}
                        type="number"
                        min="0"
                        value={row.price}
                        onChange={(e) => {
                          const next = [...data.rooms];
                          next[idx] = { ...row, price: e.target.value };
                          update("rooms", next);
                        }}
                        placeholder="9500"
                        className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 h-10 text-sm outline-none focus:border-[var(--color-brand-500)]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`${row.id}-occ`}
                        className="block text-xs font-semibold mb-1"
                      >
                        Occupancy
                      </label>
                      <input
                        id={`${row.id}-occ`}
                        type="number"
                        min="1"
                        value={row.occupancy}
                        onChange={(e) => {
                          const next = [...data.rooms];
                          next[idx] = { ...row, occupancy: e.target.value };
                          update("rooms", next);
                        }}
                        className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 h-10 text-sm outline-none focus:border-[var(--color-brand-500)]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`${row.id}-vac`}
                        className="block text-xs font-semibold mb-1"
                      >
                        Vacancies
                      </label>
                      <input
                        id={`${row.id}-vac`}
                        type="number"
                        min="0"
                        value={row.vacancies}
                        onChange={(e) => {
                          const next = [...data.rooms];
                          next[idx] = { ...row, vacancies: e.target.value };
                          update("rooms", next);
                        }}
                        className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 h-10 text-sm outline-none focus:border-[var(--color-brand-500)]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={row.ac}
                          onChange={(e) => {
                            const next = [...data.rooms];
                            next[idx] = { ...row, ac: e.target.checked };
                            update("rooms", next);
                          }}
                          className="h-4 w-4 accent-[var(--color-brand-500)]"
                        />
                        AC
                      </label>
                      {data.rooms.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Remove row ${idx + 1}`}
                          onClick={() => {
                            update(
                              "rooms",
                              data.rooms.filter((_, i) => i !== idx),
                            );
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                update("rooms", [...data.rooms, makeBlankRoom(data.rooms.length)])
              }
            >
              <Plus size={14} aria-hidden="true" />
              Add room type
            </Button>
          </section>
        )}

        {/* ============= STEP 4: AMENITIES + RULES ============= */}
        {step === "amenities" && (
          <section aria-labelledby="amenities-heading" className="space-y-5">
            <header>
              <h2 id="amenities-heading" className="text-xl font-black flex items-center gap-2">
                <Sparkles size={20} className="text-[var(--color-brand-700)]" aria-hidden="true" />
                Amenities &amp; house rules
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                Be specific about what&apos;s included and what&apos;s off-limits. It saves you
                explaining the same thing 20 times.
              </p>
            </header>

            <fieldset>
              <legend className="text-sm font-semibold mb-2">Amenities</legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITY_OPTIONS.map((a) => {
                  const checked = data.amenities.has(a.key);
                  return (
                    <label
                      key={a.key}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-colors text-sm",
                        checked
                          ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] font-semibold"
                          : "border-[var(--color-border)] hover:border-[var(--color-brand-300)]",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(data.amenities);
                          if (e.target.checked) next.add(a.key);
                          else next.delete(a.key);
                          update("amenities", next);
                        }}
                        className="h-4 w-4 accent-[var(--color-brand-500)]"
                      />
                      {a.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="lf-rules"
                className="block text-sm font-semibold mb-1.5"
              >
                House rules
              </label>
              <textarea
                id="lf-rules"
                value={data.rules}
                onChange={(e) => update("rules", e.target.value)}
                rows={4}
                placeholder={"One rule per line, e.g.:\nNo smoking indoors\nEntry by 10:30 PM\nNo overnight guests"}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-3 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)] resize-y"
              />
            </div>
          </section>
        )}

        {/* ============= STEP 5: TAGS + PREFERENCES ============= */}
        {step === "tags" && (
          <section aria-labelledby="tags-heading" className="space-y-5">
            <header>
              <h2 id="tags-heading" className="text-xl font-black flex items-center gap-2">
                <Tag size={20} className="text-[var(--color-brand-700)]" aria-hidden="true" />
                Tags &amp; preferences
              </h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                These power our wedge pages (couple-friendly, bachelor-friendly, etc.) — getting
                them right brings you SEO traffic.
              </p>
            </header>

            <fieldset>
              <legend className="text-sm font-semibold mb-2">Gender preference</legend>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {GENDER_OPTIONS.map((g) => {
                  const checked = data.gender_pref === g.value;
                  return (
                    <label
                      key={g.value}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-colors text-sm",
                        checked
                          ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] font-semibold"
                          : "border-[var(--color-border)] hover:border-[var(--color-brand-300)]",
                      )}
                    >
                      <input
                        type="radio"
                        name="gender_pref"
                        checked={checked}
                        onChange={() => update("gender_pref", g.value)}
                        className="h-4 w-4 accent-[var(--color-brand-500)]"
                      />
                      {g.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold mb-2">Wedge tags (select all that apply)</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(WEDGE_TAGS) as WedgeTag[]).map((tag) => {
                  const checked = data.wedge_tags.has(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const next = new Set(data.wedge_tags);
                        if (checked) next.delete(tag);
                        else next.add(tag);
                        update("wedge_tags", next);
                      }}
                      aria-pressed={checked}
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        checked
                          ? "border-[var(--color-brand-500)] bg-[var(--color-brand-100)] text-[var(--color-brand-900)] font-bold"
                          : "border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-[var(--color-ink-muted)] hover:border-[var(--color-brand-400)]",
                      )}
                    >
                      {WEDGE_TAGS[tag]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-sm">
              <p className="font-semibold mb-1 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-600" aria-hidden="true" />
                Honesty rule
              </p>
              <p className="text-[var(--color-ink-muted)]">
                If you tag <Badge tone="couple">Couple-Friendly</Badge> or
                <Badge tone="pet" className="ml-1">Pet-Friendly</Badge>, make sure your society
                actually allows it. Renters report dishonest tags and we suspend listings.
              </p>
            </div>
          </section>
        )}

        {/* Navigation row */}
        <div className="mt-7 flex items-center justify-between gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="md"
            onClick={back}
            disabled={isFirst || submitting !== null}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </Button>

          {isLast ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="md"
                onClick={() => handleSave("draft")}
                disabled={submitting !== null}
              >
                {submitting === "draft" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={16} aria-hidden="true" />
                    Save as draft
                  </>
                )}
              </Button>
              <Button
                variant="cta"
                size="md"
                onClick={() => handleSave("submit")}
                disabled={submitting !== null}
              >
                {submitting === "submit" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send size={16} aria-hidden="true" />
                    {mode === "edit" ? "Save changes" : "Submit for review"}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button variant="cta" size="md" onClick={next}>
              Continue
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Edit mode also exposes delete + cancel below the form */}
      {mode === "edit" && (
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5">
          <h3 className="text-sm font-bold text-red-800">Danger zone</h3>
          <p className="text-sm text-red-700/80 mt-1 mb-3">
            Deleting a listing is permanent — past inquiries stay in your chat history but the
            listing page returns a 404.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.push("/owner/listings");
              }}
            >
              Cancel changes
            </Button>
            <button
              type="button"
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  window.confirm(
                    "Delete this listing? This can't be undone. (PENDING: real delete lands in Phase 1B)",
                  )
                ) {
                  // PENDING: Supabase delete from public.listings (cascades to room_types + photos)
                  // eslint-disable-next-line no-console
                  console.log("[ListingForm] PENDING delete listing", listingId);
                  router.push("/owner/listings");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} aria-hidden="true" />
              Delete listing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
