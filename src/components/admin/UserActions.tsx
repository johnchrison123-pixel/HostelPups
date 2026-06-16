"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Shield,
  Ban,
  Check,
  LogOut,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  banUser,
  unbanUser,
  editProfile,
  setUserRole,
  deleteUser,
  forceLogoutUser,
} from "@/lib/admin-actions";
import type { AdminUserRow } from "@/lib/admin-queries";

type Panel = null | "edit" | "role" | "ban" | "delete";

interface UserActionsProps {
  user: AdminUserRow;
}

/**
 * Inline action strip for the admin user-detail page.
 *
 * Behaviour:
 *  - Only one panel is open at a time (Panel state machine).
 *  - Each panel calls a server action via useTransition, then router.refresh()
 *    on success so the page re-renders with the new data.
 *  - Errors from server actions are surfaced inline below the panel — never
 *    swallowed and never alerted.
 *
 * Server actions already do `requireAdmin()` and write to the audit log,
 * so this component is purely a UX shell.
 */
export function UserActions({ user }: UserActionsProps) {
  const router = useRouter();
  const [panel, setPanel] = React.useState<Panel>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function closePanel() {
    setPanel(null);
    setError(null);
  }

  function togglePanel(next: Panel) {
    setError(null);
    setPanel((current) => (current === next ? null : next));
  }

  // Force logout has no panel — just runs immediately.
  function handleForceLogout() {
    setError(null);
    startTransition(async () => {
      const res = await forceLogoutUser({ userId: user.id });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 sm:p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)] mb-3">
        Admin actions
      </h2>

      {/* Action button strip */}
      <div className="flex flex-wrap gap-2">
        <ActionTab
          icon={<Pencil size={14} aria-hidden="true" />}
          label="Edit profile"
          onClick={() => togglePanel("edit")}
          active={panel === "edit"}
          disabled={pending}
        />
        <ActionTab
          icon={<Shield size={14} aria-hidden="true" />}
          label="Change role"
          onClick={() => togglePanel("role")}
          active={panel === "role"}
          disabled={pending}
        />
        {user.is_banned ? (
          <ActionTab
            icon={<Check size={14} aria-hidden="true" />}
            label="Unban"
            tone="success"
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const res = await unbanUser({ userId: user.id });
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                router.refresh();
              });
            }}
            disabled={pending}
          />
        ) : (
          <ActionTab
            icon={<Ban size={14} aria-hidden="true" />}
            label="Ban"
            tone="warning"
            onClick={() => togglePanel("ban")}
            active={panel === "ban"}
            disabled={pending}
          />
        )}
        <ActionTab
          icon={<LogOut size={14} aria-hidden="true" />}
          label="Force logout"
          onClick={handleForceLogout}
          disabled={pending}
        />
        <ActionTab
          icon={<Trash2 size={14} aria-hidden="true" />}
          label="Delete user"
          tone="danger"
          onClick={() => togglePanel("delete")}
          active={panel === "delete"}
          disabled={pending}
        />
      </div>

      {/* Top-level pending / error indicators (for actions without a panel) */}
      {pending && panel === null && (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          Working…
        </p>
      )}
      {error && panel === null && (
        <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-700">
          <AlertTriangle size={14} aria-hidden="true" />
          {error}
        </p>
      )}

      {/* Inline panels */}
      {panel === "edit" && (
        <EditProfilePanel
          user={user}
          pending={pending}
          error={error}
          onCancel={closePanel}
          onSubmit={(values) => {
            setError(null);
            startTransition(async () => {
              const res = await editProfile({
                userId: user.id,
                ...values,
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              closePanel();
              router.refresh();
            });
          }}
        />
      )}

      {panel === "role" && (
        <ChangeRolePanel
          user={user}
          pending={pending}
          error={error}
          onCancel={closePanel}
          onSubmit={(role) => {
            setError(null);
            startTransition(async () => {
              const res = await setUserRole({ userId: user.id, role });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              closePanel();
              router.refresh();
            });
          }}
        />
      )}

      {panel === "ban" && !user.is_banned && (
        <BanPanel
          pending={pending}
          error={error}
          onCancel={closePanel}
          onSubmit={(reason) => {
            setError(null);
            startTransition(async () => {
              const res = await banUser({ userId: user.id, reason });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              closePanel();
              router.refresh();
            });
          }}
        />
      )}

      {panel === "delete" && (
        <DeletePanel
          userName={user.name ?? user.email ?? user.phone ?? "this user"}
          pending={pending}
          error={error}
          onCancel={closePanel}
          onSubmit={(reason) => {
            setError(null);
            startTransition(async () => {
              const res = await deleteUser({ userId: user.id, reason });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              // After deletion, send the admin back to the list.
              router.push("/admin/users");
              router.refresh();
            });
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   ActionTab — the chip-style action button
   ============================================================ */

interface ActionTabProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: "default" | "warning" | "danger" | "success";
}

function ActionTab({
  icon,
  label,
  onClick,
  active,
  disabled,
  tone = "default",
}: ActionTabProps) {
  const base =
    "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold transition-all border disabled:opacity-50 disabled:cursor-not-allowed";

  const toneClass =
    tone === "danger"
      ? active
        ? "bg-red-100 text-red-800 border-red-300"
        : "bg-white text-red-700 border-red-200 hover:bg-red-50"
      : tone === "warning"
      ? active
        ? "bg-amber-100 text-amber-900 border-amber-300"
        : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50"
      : tone === "success"
      ? active
        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
        : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
      : active
      ? "bg-[var(--color-brand-100)] text-[var(--color-brand-900)] border-[var(--color-brand-300)]"
      : "bg-[var(--color-bg)] text-[var(--color-ink)] border-[var(--color-border-strong)] hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`${base} ${toneClass}`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ============================================================
   Edit profile panel
   ============================================================ */

interface EditProfilePanelProps {
  user: AdminUserRow;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
  }) => void;
}

function EditProfilePanel({
  user,
  pending,
  error,
  onCancel,
  onSubmit,
}: EditProfilePanelProps) {
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const phoneRef = React.useRef<HTMLInputElement>(null);
  const cityRef = React.useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({
      name: nameRef.current?.value ?? undefined,
      email: emailRef.current?.value ?? undefined,
      phone: phoneRef.current?.value ?? undefined,
      city: cityRef.current?.value ?? undefined,
    });
  }

  return (
    <PanelShell title="Edit profile" onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FieldRow label="Name" htmlFor="edit-name">
          <input
            ref={nameRef}
            id="edit-name"
            type="text"
            defaultValue={user.name ?? ""}
            className={inputClass}
            disabled={pending}
            autoComplete="off"
          />
        </FieldRow>
        <FieldRow label="Email" htmlFor="edit-email">
          <input
            ref={emailRef}
            id="edit-email"
            type="email"
            defaultValue={user.email ?? ""}
            className={inputClass}
            disabled={pending}
            autoComplete="off"
          />
        </FieldRow>
        <FieldRow label="Phone" htmlFor="edit-phone">
          <input
            ref={phoneRef}
            id="edit-phone"
            type="tel"
            defaultValue={user.phone ?? ""}
            placeholder="+91…"
            className={inputClass}
            disabled={pending}
            autoComplete="off"
          />
        </FieldRow>
        <FieldRow label="City" htmlFor="edit-city">
          <input
            ref={cityRef}
            id="edit-city"
            type="text"
            placeholder="kochi"
            className={inputClass}
            disabled={pending}
            autoComplete="off"
          />
        </FieldRow>
        {error && <InlineError message={error} />}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex items-center h-9 px-3 rounded-full text-sm font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold bg-[var(--color-brand-500)] text-[var(--color-ink)] hover:bg-[var(--color-brand-600)] active:bg-[var(--color-brand-700)] shadow-[var(--shadow-sm)] transition-all disabled:opacity-50"
          >
            {pending && (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            )}
            Save changes
          </button>
        </div>
      </form>
    </PanelShell>
  );
}

/* ============================================================
   Change role panel
   ============================================================ */

interface ChangeRolePanelProps {
  user: AdminUserRow;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (role: "user" | "owner" | "admin") => void;
}

function ChangeRolePanel({
  user,
  pending,
  error,
  onCancel,
  onSubmit,
}: ChangeRolePanelProps) {
  const [role, setRole] = React.useState<"user" | "owner" | "admin">(
    (user.role === "owner" || user.role === "admin"
      ? user.role
      : "user") as "user" | "owner" | "admin",
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(role);
  }

  const noChange = role === user.role;

  return (
    <PanelShell title="Change role" onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FieldRow label="New role" htmlFor="role-select">
          <select
            id="role-select"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "user" | "owner" | "admin")
            }
            className={inputClass}
            disabled={pending}
          >
            <option value="user">User</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </select>
        </FieldRow>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Current role:{" "}
          <span className="font-semibold text-[var(--color-ink)]">
            {user.role}
          </span>
          . Promoting to admin gives full control of the panel — use sparingly.
        </p>
        {error && <InlineError message={error} />}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex items-center h-9 px-3 rounded-full text-sm font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || noChange}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold bg-[var(--color-brand-500)] text-[var(--color-ink)] hover:bg-[var(--color-brand-600)] active:bg-[var(--color-brand-700)] shadow-[var(--shadow-sm)] transition-all disabled:opacity-50"
          >
            {pending && (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            )}
            {noChange ? "No change" : `Set to ${role}`}
          </button>
        </div>
      </form>
    </PanelShell>
  );
}

/* ============================================================
   Ban panel
   ============================================================ */

interface BanPanelProps {
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}

function BanPanel({ pending, error, onCancel, onSubmit }: BanPanelProps) {
  const reasonRef = React.useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const reason = reasonRef.current?.value.trim() ?? "";
    if (reason.length < 3) {
      // Browser HTML validation handles this; just be safe.
      return;
    }
    onSubmit(reason);
  }

  return (
    <PanelShell title="Ban user" tone="warning" onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-[var(--color-ink-muted)]">
          Banning signs the user out everywhere and prevents future logins.
          They can be unbanned at any time.
        </p>
        <FieldRow label="Reason (visible in audit log)" htmlFor="ban-reason">
          <textarea
            ref={reasonRef}
            id="ban-reason"
            required
            minLength={3}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="e.g. repeated spam, harassment in inquiries, fake KYC"
            disabled={pending}
          />
        </FieldRow>
        {error && <InlineError message={error} />}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex items-center h-9 px-3 rounded-full text-sm font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 shadow-[var(--shadow-sm)] transition-all disabled:opacity-50"
          >
            {pending && (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            )}
            Confirm ban
          </button>
        </div>
      </form>
    </PanelShell>
  );
}

/* ============================================================
   Delete panel — extra confirmation gate
   ============================================================ */

interface DeletePanelProps {
  userName: string;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}

function DeletePanel({
  userName,
  pending,
  error,
  onCancel,
  onSubmit,
}: DeletePanelProps) {
  const [confirmText, setConfirmText] = React.useState("");
  const [reason, setReason] = React.useState("");

  const canSubmit = confirmText === "DELETE" && reason.trim().length >= 3;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(reason.trim());
  }

  return (
    <PanelShell title="Delete user" tone="danger" onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-900">
          <div className="inline-flex items-start gap-2">
            <AlertTriangle
              size={14}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p>
              Deleting <strong>{userName}</strong> is permanent. Their auth
              record and profile are removed. Past inquiries, calls, and
              payments stay in the database (for the audit trail) but show as
              &ldquo;deleted user.&rdquo;
            </p>
          </div>
        </div>
        <FieldRow label="Reason (visible in audit log)" htmlFor="delete-reason">
          <textarea
            id="delete-reason"
            required
            minLength={3}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="e.g. user requested account deletion, fraudulent signup, court order"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={pending}
          />
        </FieldRow>
        <FieldRow
          label={
            <>
              Type <code className="font-mono font-bold">DELETE</code> to
              confirm
            </>
          }
          htmlFor="delete-confirm"
        >
          <input
            id="delete-confirm"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className={inputClass}
            disabled={pending}
            autoComplete="off"
            aria-describedby="delete-confirm-hint"
          />
        </FieldRow>
        <p
          id="delete-confirm-hint"
          className="text-xs text-[var(--color-ink-subtle)]"
        >
          The button stays disabled until you type DELETE exactly.
        </p>
        {error && <InlineError message={error} />}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex items-center h-9 px-3 rounded-full text-sm font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-[var(--shadow-sm)] transition-all disabled:opacity-50 disabled:bg-red-300"
          >
            {pending && (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            )}
            Permanently delete
          </button>
        </div>
      </form>
    </PanelShell>
  );
}

/* ============================================================
   Shared sub-components
   ============================================================ */

const inputClass =
  "w-full h-10 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] disabled:opacity-50";

function FieldRow({
  label,
  htmlFor,
  children,
}: {
  label: React.ReactNode;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)] mb-1"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <p className="inline-flex items-start gap-1.5 text-sm font-semibold text-red-700">
      <AlertTriangle
        size={14}
        className="mt-0.5 shrink-0"
        aria-hidden="true"
      />
      {message}
    </p>
  );
}

interface PanelShellProps {
  title: string;
  tone?: "default" | "warning" | "danger";
  onClose: () => void;
  children: React.ReactNode;
}

function PanelShell({
  title,
  tone = "default",
  onClose,
  children,
}: PanelShellProps) {
  const toneRing =
    tone === "danger"
      ? "border-red-200 bg-red-50/40"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50/40"
      : "border-[var(--color-border)] bg-[var(--color-surface)]";

  return (
    <div
      className={`mt-4 rounded-2xl border p-4 ${toneRing}`}
      role="region"
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-bold">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-bg-elevated)] transition-colors"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      {children}
    </div>
  );
}
