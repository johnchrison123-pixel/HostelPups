"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  ShieldCheck,
  ShieldX,
  Pause,
  XCircle,
  CheckCircle2,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  approveOwnerKyc,
  rejectOwnerKyc,
  editOwner,
  suspendAllOwnerListings,
  banUser,
  unbanUser,
} from "@/lib/admin-actions";
import type { AdminOwnerRow } from "@/lib/admin-queries";

/**
 * Owner-detail action bundle (admin CRM).
 *
 * One client component renders every collapsible action panel. State machine:
 * a single `panel` string tracks which panel is open at a time — opening any
 * panel closes the others. Each action keeps its own `useTransition` so a
 * spinner shows only on the running action.
 *
 * After every successful action we call `router.refresh()` (the server actions
 * also call `revalidatePath`, so the cached page re-renders with new data).
 *
 * No JSON success toasts — flashes the message inline above the panel for
 * 3 seconds so the admin doesn't lose the cursor. Errors stay until dismissed
 * or the panel closes.
 */

type PanelId =
  | null
  | "edit"
  | "approve"
  | "reject"
  | "suspend"
  | "ban"
  | "unban";

interface OwnerActionsProps {
  owner: AdminOwnerRow;
  kycDocsCount?: number;
}

interface BannerState {
  tone: "success" | "error";
  text: string;
}

export function OwnerActions({ owner, kycDocsCount = 0 }: OwnerActionsProps) {
  const router = useRouter();
  const [panel, setPanel] = React.useState<PanelId>(null);
  const [banner, setBanner] = React.useState<BannerState | null>(null);

  // Banner auto-dismiss for success only
  React.useEffect(() => {
    if (!banner || banner.tone !== "success") return;
    const t = window.setTimeout(() => setBanner(null), 3500);
    return () => window.clearTimeout(t);
  }, [banner]);

  function open(next: PanelId) {
    setPanel((prev) => (prev === next ? null : next));
    setBanner(null);
  }

  function handleResult(
    result: { ok: true } | { ok: false; error: string },
    successText: string,
  ) {
    if (result.ok) {
      setBanner({ tone: "success", text: successText });
      setPanel(null);
      router.refresh();
    } else {
      setBanner({ tone: "error", text: result.error });
    }
  }

  const isPendingKyc = owner.kyc_status === "pending";
  const isRejectedKyc = owner.kyc_status === "rejected";
  const isNotSubmittedKyc = owner.kyc_status === "not_submitted";
  const isVerifiedKyc = owner.kyc_status === "verified";
  const showKycPanel = isPendingKyc || isRejectedKyc || isNotSubmittedKyc;

  return (
    <div className="space-y-6">
      {banner && (
        <div
          role="status"
          className={
            banner.tone === "success"
              ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 flex items-start gap-2"
              : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 flex items-start gap-2"
          }
        >
          {banner.tone === "success" ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span className="flex-1">{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            aria-label="Dismiss"
            className="rounded-full p-0.5 hover:bg-black/5"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ============================================================
         KYC review panel
         ============================================================ */}
      {showKycPanel && (
        <KycReviewPanel
          ownerId={owner.id}
          ownerBusinessName={
            owner.business_name?.trim() || owner.name?.trim() || "this owner"
          }
          kycDocsCount={kycDocsCount}
          status={owner.kyc_status}
          panel={panel}
          open={open}
          onResult={handleResult}
        />
      )}

      {isVerifiedKyc && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-start gap-3">
          <ShieldCheck
            size={18}
            className="text-emerald-700 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="text-sm">
            <p className="font-bold text-emerald-900">KYC verified</p>
            <p className="mt-0.5 text-emerald-800">
              This owner&apos;s identity has been confirmed. No further KYC action needed.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================
         Edit owner panel
         ============================================================ */}
      <EditOwnerPanel
        owner={owner}
        isOpen={panel === "edit"}
        onToggle={() => open("edit")}
        onResult={handleResult}
      />

      {/* ============================================================
         Danger zone
         ============================================================ */}
      <DangerZone
        owner={owner}
        panel={panel}
        open={open}
        onResult={handleResult}
      />
    </div>
  );
}

/* ============================================================
   KYC review panel
   ============================================================ */

function KycReviewPanel({
  ownerId,
  ownerBusinessName,
  kycDocsCount,
  status,
  panel,
  open,
  onResult,
}: {
  ownerId: string;
  ownerBusinessName: string;
  kycDocsCount: number;
  status: string;
  panel: PanelId;
  open: (id: PanelId) => void;
  onResult: (
    r: { ok: true } | { ok: false; error: string },
    successText: string,
  ) => void;
}) {
  const [approving, startApprove] = React.useTransition();
  const [rejecting, startReject] = React.useTransition();
  const [reason, setReason] = React.useState("");
  // Confirm step for Approve (fix 15)
  const [confirmApprove, setConfirmApprove] = React.useState(false);
  // Override: verify without docs (fix 14)
  const [overrideReason, setOverrideReason] = React.useState("");
  const [showOverride, setShowOverride] = React.useState(false);

  const hasNoDocs = kycDocsCount === 0;

  function doApprove() {
    startApprove(async () => {
      const r = await approveOwnerKyc({ ownerId });
      setConfirmApprove(false);
      onResult(r, "KYC approved. Owner is now verified.");
    });
  }

  function doApproveOverride() {
    if (overrideReason.trim().length < 10) return;
    startApprove(async () => {
      const r = await approveOwnerKyc({ ownerId });
      setShowOverride(false);
      setOverrideReason("");
      onResult(r, "KYC approved (no-docs override). Owner is now verified.");
    });
  }

  function doReject() {
    startReject(async () => {
      const r = await rejectOwnerKyc({ ownerId, reason });
      if (r.ok) setReason("");
      onResult(r, "KYC rejected.");
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shrink-0">
          <ShieldCheck size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">KYC review</h3>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Current status:{" "}
            <span className="font-semibold capitalize">
              {status.replace("_", " ")}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {/* Approve button — disabled when no docs, with override alternative */}
        {!hasNoDocs && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setConfirmApprove(true)}
            disabled={approving || rejecting || confirmApprove}
            aria-label="Approve KYC"
          >
            <ShieldCheck size={14} aria-hidden="true" />
            Approve KYC
          </Button>
        )}
        {hasNoDocs && (
          <div className="flex flex-col gap-1.5">
            <Button
              variant="primary"
              size="sm"
              disabled
              aria-label="Approve KYC — no documents on file"
            >
              <ShieldCheck size={14} aria-hidden="true" />
              Approve KYC
            </Button>
            <p className="text-[11px] text-amber-700 font-medium">
              Cannot approve — no documents on file.{" "}
              <button
                type="button"
                onClick={() => setShowOverride((v) => !v)}
                className="underline hover:no-underline"
              >
                Verify without documents (override)
              </button>
            </p>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => open("reject")}
          disabled={approving || rejecting}
          aria-expanded={panel === "reject"}
          aria-controls="reject-kyc-panel"
        >
          <ShieldX size={14} aria-hidden="true" />
          Reject KYC
        </Button>
      </div>

      {/* Confirm step for Approve (fix 15) */}
      {confirmApprove && !hasNoDocs && (
        <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-sm font-semibold text-emerald-900">
            Mark KYC as verified for {ownerBusinessName}?
          </p>
          <div className="mt-3 flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmApprove(false)}
              disabled={approving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={doApprove}
              disabled={approving}
            >
              {approving ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck size={14} aria-hidden="true" />
              )}
              Yes, approve
            </Button>
          </div>
        </div>
      )}

      {/* Override panel (fix 14) */}
      {showOverride && hasNoDocs && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs font-semibold text-amber-900 mb-2">
            Override reason — min 10 chars (required for audit log)
          </p>
          <textarea
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            rows={2}
            placeholder="Why are you approving without docs? e.g. In-person verification completed."
            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            disabled={approving}
          />
          <div className="mt-3 flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowOverride(false); setOverrideReason(""); }}
              disabled={approving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={doApproveOverride}
              disabled={approving || overrideReason.trim().length < 10}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {approving ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck size={14} aria-hidden="true" />
              )}
              Approve without docs
            </Button>
          </div>
        </div>
      )}

      {panel === "reject" && (
        <div
          id="reject-kyc-panel"
          className="mt-4 rounded-xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]"
        >
          <label
            htmlFor="reject-reason"
            className="block text-xs font-semibold text-[var(--color-ink)] mb-2"
          >
            Reason for rejection (shared with the audit log) — min 3 chars
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. ID document is blurry — please re-upload a clearer photo."
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
            disabled={rejecting}
          />
          <div className="mt-3 flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => open(null)}
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={doReject}
              disabled={rejecting || reason.trim().length < 3}
            >
              {rejecting ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <ShieldX size={14} aria-hidden="true" />
              )}
              Confirm reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Edit owner panel
   ============================================================ */

function EditOwnerPanel({
  owner,
  isOpen,
  onToggle,
  onResult,
}: {
  owner: AdminOwnerRow;
  isOpen: boolean;
  onToggle: () => void;
  onResult: (
    r: { ok: true } | { ok: false; error: string },
    successText: string,
  ) => void;
}) {
  const [saving, startSave] = React.useTransition();
  const [businessName, setBusinessName] = React.useState(
    owner.business_name ?? "",
  );
  const [contactPhone, setContactPhone] = React.useState(
    owner.contact_phone ?? "",
  );
  const [tier, setTier] = React.useState(owner.tier ?? "self_serve");

  // Reset state when the panel reopens with fresh server data.
  // Intentional setState sync to props — the alternative (a `key` prop on the
  // panel) would unmount the form on every owner refresh and lose pending edits.
  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBusinessName(owner.business_name ?? "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContactPhone(owner.contact_phone ?? "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTier(owner.tier ?? "self_serve");
    }
  }, [
    isOpen,
    owner.business_name,
    owner.contact_phone,
    owner.tier,
  ]);

  function doSave(e: React.FormEvent) {
    e.preventDefault();
    startSave(async () => {
      const r = await editOwner({
        ownerId: owner.id,
        business_name: businessName.trim(),
        contact_phone: contactPhone.trim(),
        tier,
      });
      onResult(r, "Owner details updated.");
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-sm)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="edit-owner-panel"
        className="w-full flex items-start gap-3 text-left"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shrink-0">
          <Pencil size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">Edit owner</h3>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Business name, contact phone, tier.
          </p>
        </div>
        <span className="text-xs font-semibold text-[var(--color-brand-700)] shrink-0 mt-1">
          {isOpen ? "Close" : "Open"}
        </span>
      </button>

      {isOpen && (
        <form
          id="edit-owner-panel"
          onSubmit={doSave}
          className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <div className="sm:col-span-2">
            <label
              htmlFor="edit-business-name"
              className="block text-xs font-semibold mb-1"
            >
              Business name
            </label>
            <input
              id="edit-business-name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
            />
          </div>
          <div>
            <label
              htmlFor="edit-contact-phone"
              className="block text-xs font-semibold mb-1"
            >
              Contact phone
            </label>
            <input
              id="edit-contact-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={saving}
              placeholder="+91XXXXXXXXXX"
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
            />
          </div>
          <div>
            <label
              htmlFor="edit-tier"
              className="block text-xs font-semibold mb-1"
            >
              Tier
            </label>
            <select
              id="edit-tier"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
            >
              <option value="self_serve">Self-serve</option>
              <option value="full_service">Full service</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex gap-2 justify-end mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              disabled={saving}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={saving} type="submit">
              {saving ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Pencil size={14} aria-hidden="true" />
              )}
              Save changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ============================================================
   Danger zone — suspend all listings, ban/unban user
   ============================================================ */

function DangerZone({
  owner,
  panel,
  open,
  onResult,
}: {
  owner: AdminOwnerRow;
  panel: PanelId;
  open: (id: PanelId) => void;
  onResult: (
    r: { ok: true } | { ok: false; error: string },
    successText: string,
  ) => void;
}) {
  const [suspending, startSuspend] = React.useTransition();
  const [banning, startBan] = React.useTransition();
  const [unbanning, startUnban] = React.useTransition();
  const [suspendReason, setSuspendReason] = React.useState("");
  const [banReason, setBanReason] = React.useState("");

  function doSuspend() {
    startSuspend(async () => {
      const r = await suspendAllOwnerListings({
        ownerId: owner.id,
        reason: suspendReason,
      });
      if (r.ok) setSuspendReason("");
      onResult(r, "All listings suspended (set to paused).");
    });
  }

  function doBan() {
    startBan(async () => {
      const r = await banUser({ userId: owner.id, reason: banReason });
      if (r.ok) setBanReason("");
      onResult(r, "User account banned and signed out everywhere.");
    });
  }

  function doUnban() {
    startUnban(async () => {
      const r = await unbanUser({ userId: owner.id });
      onResult(r, "User account unbanned.");
    });
  }

  return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50/40 p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700 shrink-0">
          <AlertTriangle size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-red-900">Danger zone</h3>
          <p className="text-xs text-red-800/80 mt-0.5">
            These actions affect the owner&apos;s listings or the underlying user
            account. Every action is logged in the audit trail.
          </p>
        </div>
      </div>

      {/* Suspend all listings */}
      <div className="mt-4 rounded-xl bg-white border border-red-200 p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Suspend all listings</p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              Sets every listing for this owner to{" "}
              <code className="font-mono">paused</code>. Owner can&apos;t restore
              them without admin help.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => open("suspend")}
            disabled={suspending}
            aria-expanded={panel === "suspend"}
            aria-controls="suspend-panel"
          >
            <Pause size={14} aria-hidden="true" />
            Suspend all
          </Button>
        </div>
        {panel === "suspend" && (
          <div id="suspend-panel" className="mt-3">
            <label
              htmlFor="suspend-reason"
              className="block text-xs font-semibold mb-1"
            >
              Reason (min 3 chars) — required for the audit log
            </label>
            <textarea
              id="suspend-reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
              placeholder="e.g. Repeated guideline violations on inquiry chat."
              className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              disabled={suspending}
            />
            <div className="mt-3 flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => open(null)}
                disabled={suspending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={doSuspend}
                disabled={suspending || suspendReason.trim().length < 3}
                className="bg-red-600 hover:bg-red-700 active:bg-red-800"
              >
                {suspending ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Pause size={14} aria-hidden="true" />
                )}
                Confirm suspend
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Ban / Unban */}
      <div className="mt-3 rounded-xl bg-white border border-red-200 p-3">
        {owner.is_banned ? (
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Unban user account</p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                Restores login. Listings stay in their current status — review
                them separately.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={doUnban}
              disabled={unbanning}
            >
              {unbanning ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 size={14} aria-hidden="true" />
              )}
              Unban user
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Ban underlying user</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Signs them out everywhere and blocks login. Use for repeat
                  abusers or fraud — listings remain visible until you suspend
                  them.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => open("ban")}
                disabled={banning}
                aria-expanded={panel === "ban"}
                aria-controls="ban-panel"
              >
                <XCircle size={14} aria-hidden="true" />
                Ban user
              </Button>
            </div>
            {panel === "ban" && (
              <div id="ban-panel" className="mt-3">
                <label
                  htmlFor="ban-reason"
                  className="block text-xs font-semibold mb-1"
                >
                  Reason (min 3 chars) — required for the audit log
                </label>
                <textarea
                  id="ban-reason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Fraudulent listings + ignored takedown notice."
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  disabled={banning}
                />
                <div className="mt-3 flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => open(null)}
                    disabled={banning}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={doBan}
                    disabled={banning || banReason.trim().length < 3}
                    className="bg-red-600 hover:bg-red-700 active:bg-red-800"
                  >
                    {banning ? (
                      <Loader2
                        size={14}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle size={14} aria-hidden="true" />
                    )}
                    Confirm ban
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
