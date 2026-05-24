"use client";

import * as React from "react";
import { UploadCloud, X, Star, ArrowLeft, ArrowRight, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploaderPhoto {
  /** local id only — Supabase Storage upload (PENDING Phase 1B) returns real urls */
  id: string;
  /** object URL preview (created with URL.createObjectURL) — null when no file */
  preview: string | null;
  /** display label, defaults to "Photo {n}" */
  name: string;
}

interface PhotoUploaderProps {
  maxPhotos?: number;
  /** Initial sample photos for the edit/new screens. Optional. */
  initial?: UploaderPhoto[];
  /** Notified when the photo array changes — currently unused, ready for Phase 1B */
  onChange?: (photos: UploaderPhoto[]) => void;
}

/**
 * Drag-and-drop / click photo uploader for owner listing form.
 *
 * PENDING (Phase 1B): wire to Supabase Storage `listing-photos` bucket.
 * For now this only stores local previews in component state.
 */
export function PhotoUploader({
  maxPhotos = 10,
  initial = [],
  onChange,
}: PhotoUploaderProps) {
  const [photos, setPhotos] = React.useState<UploaderPhoto[]>(initial);
  const [coverIdx, setCoverIdx] = React.useState(0);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    onChange?.(photos);
    // Revoke object URLs on unmount to avoid memory leaks
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
  }, [photos]);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = Math.max(0, maxPhotos - photos.length);
    const slice = Array.from(files).slice(0, remaining);
    const next: UploaderPhoto[] = slice.map((f, i) => ({
      id: `${Date.now()}_${i}`,
      preview: URL.createObjectURL(f),
      name: f.name,
    }));
    setPhotos((prev) => [...prev, ...next]);
  }

  function removeAt(idx: number) {
    setPhotos((prev) => {
      const target = prev[idx];
      if (target?.preview?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(target.preview);
        } catch {
          // ignore
        }
      }
      const next = prev.filter((_, i) => i !== idx);
      // Re-anchor cover
      if (coverIdx >= next.length) setCoverIdx(Math.max(0, next.length - 1));
      return next;
    });
  }

  function reorder(idx: number, dir: -1 | 1) {
    setPhotos((prev) => {
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      // Move cover with it if needed
      if (coverIdx === idx) setCoverIdx(targetIdx);
      else if (coverIdx === targetIdx) setCoverIdx(idx);
      return next;
    });
  }

  function markCover(idx: number) {
    setCoverIdx(idx);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          dragOver
            ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)]"
            : "border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-brand-50)]/40",
          !canAddMore && "opacity-60 pointer-events-none",
        )}
      >
        <UploadCloud
          size={36}
          className="mx-auto text-[var(--color-brand-600)]"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm font-semibold">
          Drag photos here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[var(--color-brand-700)] underline hover:no-underline font-bold"
          >
            click to browse
          </button>
        </p>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          JPG, PNG or WebP — up to {maxPhotos} photos. Drag to reorder. Mark one as cover.
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-wider font-bold text-amber-700">
          PENDING — uploads land in Supabase Storage in Phase 1B
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
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
                coverIdx === i
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

              {/* Cover badge */}
              {coverIdx === i && (
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
                    onClick={() => reorder(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move photo ${i + 1} left`}
                    className="h-7 w-7 rounded-full bg-white/95 backdrop-blur-sm shadow-sm inline-flex items-center justify-center disabled:opacity-40"
                  >
                    <ArrowLeft size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorder(i, 1)}
                    disabled={i === photos.length - 1}
                    aria-label={`Move photo ${i + 1} right`}
                    className="h-7 w-7 rounded-full bg-white/95 backdrop-blur-sm shadow-sm inline-flex items-center justify-center disabled:opacity-40"
                  >
                    <ArrowRight size={12} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {coverIdx !== i && (
                    <button
                      type="button"
                      onClick={() => markCover(i)}
                      aria-label={`Mark photo ${i + 1} as cover`}
                      className="h-7 w-7 rounded-full bg-white/95 backdrop-blur-sm shadow-sm inline-flex items-center justify-center text-amber-600 hover:text-amber-700"
                    >
                      <Star size={12} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
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
