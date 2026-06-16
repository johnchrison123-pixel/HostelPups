"use client";

import { useState } from "react";

interface Props {
  before: unknown;
  after: unknown;
}

export function AuditRowExpand({ before, after }: Props) {
  const [open, setOpen] = useState(false);

  const hasDiff = before != null || after != null;
  if (!hasDiff) {
    return <span className="text-xs text-[var(--color-ink-subtle)]">—</span>;
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-[var(--color-brand-700)] hover:underline"
        aria-expanded={open}
      >
        {open ? "Hide" : "Show diff"}
      </button>
      {open && (
        <details open className="mt-2">
          <summary className="sr-only">Diff</summary>
          <div className="flex flex-col gap-2 min-w-[280px] max-w-[440px]">
            {before != null && (
              <div>
                <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-1">
                  Before
                </p>
                <pre className="rounded-lg bg-red-50 border border-red-200 p-2 text-xs overflow-x-auto text-red-900 leading-relaxed whitespace-pre-wrap break-all">
                  {JSON.stringify(before, null, 2)}
                </pre>
              </div>
            )}
            {after != null && (
              <div>
                <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-1">
                  After
                </p>
                <pre className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs overflow-x-auto text-emerald-900 leading-relaxed whitespace-pre-wrap break-all">
                  {JSON.stringify(after, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
