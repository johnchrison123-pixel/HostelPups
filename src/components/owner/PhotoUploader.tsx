"use client";

import * as React from "react";
import {
  UploadCloud,
  X,
  Star,
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export interface UploaderPhoto {
  /** Row id from listing_photos (DB-backed) or a local-only id for in-flight uploads */
  id: string;
  /** Storage path inside `listing-photos` bucket — used to delete the object */
  path?: string;
  /** Public URL — used as the <img src>; falls back to preview for in-flight uploads */
  preview: string | null;
  /** Display label */
  name: string;
  /** True if this row is the cover photo */
  isCover?: boolean;
  /** Display order within the listing */
  order?: number;
}

interface PhotoUploaderProps {
  /** Required for actual uploads. If absent, the uploader shows a "save draft first" hint. */
  listingId?: string;
  maxPhotos?: number;
  initial?: UploaderPhoto[];
}

const BUCKET = "listing-photos";

/**
 * Drag-and-drop / click photo uploader for owner listings.
 *
 * Uploads go directly from the browser to Supabase Storage (`listing-photos`
 * bucket) using the user's auth cookie. RLS scopes uploads to
 *   <uid>/<listingId>/<random>.<ext>
 * per `storage_policies` in supabase/migrations/0003_storage_setup.sql.
 *
 * After a successful upload we INSERT a `listing_photos` row pointing to the
 * public URL. RLS on `listing_photos` requires that the listing's owner_id
 * = auth.uid(), so the only way this insert succeeds is if the caller is
 * the listing's owner.
 *
 * If `listingId` is missing (NEW listing not yet saved), uploads are disabled
 * and we show a hint to save as draft first.
 */
export function PhotoUploader({
  listingId,
  maxPhotos = 10,
  initial = [],
}: PhotoUploaderProps) {
  const [photos, setPhotos] = React.useState<UploaderPhoto[]>(initial);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const supabase = React.useMemo(() => createClient(), []);

  const canUpload = !!listingId;
  const canAddMore = photos.length < maxPhotos;

  // Revoke any leftover blob URLs on unmount to avoid memory leaks
  React.useEffect(() => {
    return () => {
      for (const p of photos) {
        if (p.preview && p.preview.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(p.preview);
          } catch {
            // ignore
          }
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!listingId) {
      setError("Save your listing as a draft first, then upload photos.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You are signed out. Please log in again.");
        setUploading(false);
        return;
      }

      const remaining = Math.max(0, maxPhotos - photos.length);
      const slice = Array.from(files).slice(0, remaining);

      for (const file of slice) {
        // Validate type + size client-side. Server policies are the source
        // of truth, but failing fast here saves a round trip.
        if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) {
          setError(`"${file.name}" is not a JPG / PNG / WebP image — skipped.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`"${file.name}" is over 5 MB — skipped.`);
          continue;
        }

        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const uniqueId =
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const path = `${user.id}/${listingId}/${uniqueId}.${ext}`;

        const { error: upError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upError) {
          setError(`Upload failed: ${upError.message}`);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(path);

        // First photo ever is auto-cover.
        const isCover = photos.length === 0;
        const order = photos.length;

        const { data: row, error: dbError } = await supabase
          .from("listing_photos")
          .insert({
            listing_id: listingId,
            url: publicUrl,
            display_order: order,
            is_cover: isCover,
          })
          .select()
          .single();

        if (dbError) {
          // Roll back the storage upload so we don't leak files.
          await supabase.storage.from(BUCKET).remove([path]);
          setError(`Couldn't save photo record: ${dbError.message}`);
          continue;
        }

        setPhotos((prev) => [
          ...prev,
          {
            id: row.id,
            path,
            preview: publicUrl,
            name: file.name,
            isCover,
            order,
          },
        ]);
      }
    } finally {
      setUploading(false);
      // Allow uploading the same file again later (browser keeps last selection otherwise)
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeAt(idx: number) {
    if (!listingId) return;
    const target = photos[idx];
    if (!target) return;

    setError(null);

    // Optimistic remove
    const snapshot = photos;
    setPhotos((prev) => prev.filter((_, i) => i !== idx));

    try {
      // Delete the DB row (RLS scopes to the listing's owner)
      const { error: dbError } = await supabase
        .from("listing_photos")
        .delete()
        .eq("id", target.id);
      if (dbError) throw dbError;

      // Delete the storage object (best-effort — DB is source of truth)
      if (target.path) {
        await supabase.storage.from(BUCKET).remove([target.path]);
      }

      // If we deleted the cover, promote the new first photo
      if (target.isCover) {
        const replacement = snapshot.filter((_, i) => i !== idx)[0];
        if (replacement) {
          await supabase
            .from("listing_photos")
            .update({ is_cover: true })
            .eq("id", replacement.id);
          setPhotos((prev) =>
            prev.map((p) => ({ ...p, isCover: p.id === replacement.id })),
          );
        }
      }
    } catch (e) {
      // Restore on failure
      setPhotos(snapshot);
      const msg = (e as Error).message;
      setError(`Couldn't delete photo: ${msg}`);
    }
  }

  async function markCover(idx: number) {
    const target = photos[idx];
    if (!target || target.isCover) return;
    setError(null);

    const snapshot = photos;
    setPhotos((prev) => prev.map((p, i) => ({ ...p, isCover: i === idx })));

    try {
      // Unmark previous covers
      const previousCovers = snapshot.filter((p) => p.isCover);
      for (const p of previousCovers) {
        await supabase
          .from("listing_photos")
          .update({ is_cover: false })
          .eq("id", p.id);
      }
      // Mark new cover
      const { error: upErr } = await supabase
        .from("listing_photos")
        .update({ is_cover: true })
        .eq("id", target.id);
      if (upErr) throw upErr;
    } catch (e) {
      setPhotos(snapshot);
      setError(`Couldn't update cover: ${(e as Error).message}`);
    }
  }

  async function reorder(idx: number, dir: -1 | 1) {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= photos.length) return;
    setError(null);

    const snapshot = photos;
    const reordered = [...photos];
    [reordered[idx], reordered[targetIdx]] = [
      reordered[targetIdx],
      reordered[idx],
    ];
    setPhotos(reordered.map((p, i) => ({ ...p, order: i })));

    try {
      // Persist new display_order values. We rewrite both swapped rows.
      const a = snapshot[idx];
      const b = snapshot[targetIdx];
      await Promise.all([
        supabase
          .from("listing_photos")
          .update({ display_order: targetIdx })
          .eq("id", a.id),
        supabase
          .from("listing_photos")
          .update({ display_order: idx })
          .eq("id", b.id),
      ]);
    } catch (e) {
      setPhotos(snapshot);
      setError(`Couldn't reorder: ${(e as Error).message}`);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      {!canUpload && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            <strong>Save your listing as a draft first</strong>, then come back to
            this step to upload photos. Photos need a listing id to attach to.
          </span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          if (!canUpload) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={canUpload ? onDrop : undefined}
        className={cn(
          "rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          dragOver
            ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)]"
            : "border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-brand-50)]/40",
          (!canAddMore || !canUpload) && "opacity-60 pointer-events-none",
        )}
      >
        {uploading ? (
          <Loader2
            size={36}
            className="mx-auto text-[var(--color-brand-600)] animate-spin"
            aria-hidden="true"
          />
        ) : (
          <UploadCloud
            size={36}
            className="mx-auto text-[var(--color-brand-600)]"
            aria-hidden="true"
          />
        )}
        <p className="mt-3 text-sm font-semibold">
          {uploading
            ? "Uploading…"
            : canUpload
              ? (
                <>
                  Drag photos here, or{" "}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-[var(--color-brand-700)] underline hover:no-underline font-bold"
                  >
                    click to browse
                  </button>
                </>
              )
              : "Photo upload is disabled until you save a draft."}
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          JPG, PNG or WebP — up to 5 MB each, max {maxPhotos} photos.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          disabled={!canUpload || uploading || !canAddMore}
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {/* Existing photos */}
      {photos.length > 0 && (
        <ul
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          role="list"
        >
          {photos.map((p, i) => (
            <li
              key={p.id}
              className={cn(
                "group relative rounded-xl overflow-hidden border bg-[var(--color-bg-elevated)] aspect-square",
                p.isCover
                  ? "border-[var(--color-brand-500)] ring-2 ring-[var(--color-brand-200)]"
                  : "border-[var(--color-border)]",
              )}
            >
              {p.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.preview}
                  alt={p.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-ink-subtle)]">
                  <ImagePlus size={28} aria-hidden="true" />
                </div>
              )}

              {p.isCover && (
                <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-500)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-ink)]">
                  <Star size={10} className="fill-current" aria-hidden="true" />
                  Cover
                </span>
              )}

              {/* Controls overlay */}
              <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void reorder(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move photo ${i + 1} left`}
                    className="h-7 w-7 rounded-full bg-white/95 backdrop-blur-sm shadow-sm inline-flex items-center justify-center disabled:opacity-40"
                  >
                    <ArrowLeft size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void reorder(i, 1)}
                    disabled={i === photos.length - 1}
                    aria-label={`Move photo ${i + 1} right`}
                    className="h-7 w-7 rounded-full bg-white/95 backdrop-blur-sm shadow-sm inline-flex items-center justify-center disabled:opacity-40"
                  >
                    <ArrowRight size={12} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {!p.isCover && (
                    <button
                      type="button"
                      onClick={() => void markCover(i)}
                      aria-label={`Mark photo ${i + 1} as cover`}
                      className="h-7 w-7 rounded-full bg-white/95 backdrop-blur-sm shadow-sm inline-flex items-center justify-center text-amber-600 hover:text-amber-700"
                    >
                      <Star size={12} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void removeAt(i)}
                    aria-label={`Remove photo ${i + 1}`}
                    className="h-7 w-7 rounded-full bg-white/95 backdrop-blur-sm shadow-sm inline-flex items-center justify-center text-red-600 hover:text-red-700"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-[var(--color-ink-subtle)]">
        {photos.length} / {maxPhotos} photos
      </p>
    </div>
  );
}
