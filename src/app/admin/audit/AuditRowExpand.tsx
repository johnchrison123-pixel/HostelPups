"use client";

import { useMemo, useState } from "react";

interface Props {
  before: unknown;
  after: unknown;
}

const TRUNCATE_THRESHOLD = 5000;

function stringifyTruncated(value: unknown): {
  display: string;
  full: string;
  truncated: boolean;
} {
  const full = JSON.stringify(value, null, 2);
  if (full.length > TRUNCATE_THRESHOLD) {
    return {
      display: full.slice(0, TRUNCATE_THRESHOLD) + "... (truncated)",
      full,
      truncated: true,
    };
  }
  return { display: full, full, truncated: false };
}

interface CopyButtonProps {
  payload: string;
}

function CopyButton({ payload }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    try {
      void navigator.clipboard.writeText(payload).then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      });
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)] hover:text-[var(--color-brand-700)] hover:underline"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function AuditRowExpand({ before, after }: Props) {
  const [open, setOpen] = useState(false);

  const hasDiff = before != null || after != null;

  const beforeData = useMemo(
    () => (before != null ? stringifyTruncated(before) : null),
    [before],
  );
  const afterData = useMemo(
    () => (after != null ? stringifyTruncated(after) : null),
    [after],
  );

  if (!hasDiff) {
    return <span className="text-xs text-[var(--color-ink-subtle)]">—</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-[var(--color-brand-700)] hover:underline"
        aria-expanded={open}
      >
        {open ? "Hide" : "Show diff"}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2 min-w-[280px] max-w-[440px]">
          {beforeData && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                  Before
                </p>
                <CopyButton payload={beforeData.full} />
              </div>
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-red-200 bg-red-50">
                <pre className="p-2 text-xs overflow-x-auto text-red-900 leading-relaxed whitespace-pre-wrap break-all">
                  {beforeData.display}
                </pre>
              </div>
            </div>
          )}
          {afterData && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                  After
                </p>
                <CopyButton payload={afterData.full} />
              </div>
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-emerald-200 bg-emerald-50">
                <pre className="p-2 text-xs overflow-x-auto text-emerald-900 leading-relaxed whitespace-pre-wrap break-all">
                  {afterData.display}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
