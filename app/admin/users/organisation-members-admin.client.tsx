"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type OrganisationMemberRow = {
  membershipId: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  clerkLinked: boolean;
  membershipCreatedAt: string;
  membershipUpdatedAt: string;
  userCreatedAt: string;
};

const ROLES = ["Admin", "User", "Viewer"] as const;

function formatShort(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OrganisationMembersAdminClient({
  organisationName,
  currentUserId,
  initialMembers,
  soleAdminMembershipId,
}: {
  organisationName: string;
  currentUserId: string;
  initialMembers: OrganisationMemberRow[];
  soleAdminMembershipId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [draftRoles, setDraftRoles] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialMembers.map((m) => [m.membershipId, m.role])),
  );

  useEffect(() => {
    setDraftRoles(Object.fromEntries(initialMembers.map((m) => [m.membershipId, m.role])));
  }, [initialMembers]);

  const rows = initialMembers;

  async function patchRole(membershipId: string, role: string) {
    setError(null);
    setPendingId(membershipId);
    const res = await fetch(`/api/admin/users/${membershipId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role }),
    });
    setPendingId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : `Update failed (${res.status})`);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function removeMember(membershipId: string) {
    if (!window.confirm("Remove this person from the organisation? They will lose access to this workspace unless they belong elsewhere.")) {
      return;
    }
    setError(null);
    setPendingId(membershipId);
    const res = await fetch(`/api/admin/users/${membershipId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setPendingId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : `Remove failed (${res.status})`);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="rounded-[1.1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_38%,transparent)] px-4 py-3 sm:px-5">
        <p className="text-sm leading-6 text-[--metis-paper-muted]">
          Invitations are managed in Clerk. After someone accepts an invite, Metis syncs their membership via Clerk webhooks. Use this page to set{" "}
          <strong className="text-[--metis-paper]">product roles</strong> (Admin / User / Viewer) for this workspace only.
        </p>
      </div>

      {error ? (
        <div className="rounded-[1rem] border border-rose-400/25 bg-rose-900/20 px-4 py-3 text-sm text-rose-100" role="alert">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[1.25rem] border border-[--metis-outline-subtle]">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_55%,transparent)] text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[--metis-ink-soft]">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Auth</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const draft = draftRoles[m.membershipId] ?? m.role;
              const busy = pendingId === m.membershipId || isPending;
              const dirty = draft !== m.role;
              const isSoleAdminRow = soleAdminMembershipId != null && m.membershipId === soleAdminMembershipId;
              const soleAdminSaveBlocked = isSoleAdminRow && draft !== "Admin";
              return (
                <tr key={m.membershipId} className="border-b border-[--metis-outline-subtle]/80 last:border-0">
                  <td className="px-4 py-3 text-[--metis-paper]">{m.displayName}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-[--metis-paper-muted]" title={m.email}>
                    {m.email}
                  </td>
                  <td className="px-4 py-3 text-[--metis-paper-muted]">{m.clerkLinked ? "Clerk-linked" : "Legacy / local"}</td>
                  <td className="px-4 py-3">
                    <select
                      className={cn(
                        "w-full min-w-[7.5rem] rounded-[0.65rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_70%,transparent)] px-2 py-1.5 text-[--metis-paper] outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/50",
                        dirty && "border-[--metis-brass]/50",
                      )}
                      value={draft}
                      disabled={busy}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraftRoles((prev) => ({ ...prev, [m.membershipId]: v }));
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[--metis-paper-muted]">{formatShort(m.membershipCreatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        className="rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]"
                        disabled={busy || !dirty || soleAdminSaveBlocked}
                        title={soleAdminSaveBlocked ? "This organisation must keep at least one Admin." : undefined}
                        onClick={() => patchRole(m.membershipId, draft)}
                      >
                        Save role
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full border-rose-400/30 text-rose-100 hover:bg-rose-900/30"
                        disabled={busy || isSoleAdminRow}
                        title={isSoleAdminRow ? "Cannot remove the only Admin for this organisation." : undefined}
                        onClick={() => removeMember(m.membershipId)}
                      >
                        Remove from organisation
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[--metis-paper-muted]">
        Workspace: <span className="text-[--metis-paper]">{organisationName}</span> · You are signed in as{" "}
        <span className="text-[--metis-paper]">{rows.find((r) => r.userId === currentUserId)?.email ?? currentUserId}</span>
      </p>
    </div>
  );
}
