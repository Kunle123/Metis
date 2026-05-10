"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { BriefMode } from "@metis/shared/briefVersion";
import type { ExportFormat } from "@metis/shared/export";
import {
  MESSAGE_APPROVAL_STATUS_ORDER,
  MessageApprovalStatusSchema,
  approvalStatusDisplayLabel,
  type MessageApprovalStatus,
} from "@metis/shared/approvalStatus";

import { ControlField, ControlSelect } from "@/components/ui/control";
import { approvalStatusBadgeClassNames } from "@/lib/approvals/approvalStatusUi";

export type RecentExportRow = {
  id: string;
  filename: string;
  format: ExportFormat;
  mode: BriefMode;
  approvalStatus: MessageApprovalStatus;
  createdAtIso: string;
};

const FORMAT_LABEL: Record<ExportFormat, string> = {
  "full-issue-brief": "Full issue brief",
  "executive-brief": "Executive brief",
  "board-note": "Board note",
  "email-ready": "Email-ready",
};

export function ExportRecentPackagesClient({
  issueId,
  canUpdateApproval,
  initialRows,
}: {
  issueId: string;
  canUpdateApproval: boolean;
  initialRows: RecentExportRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  async function patchStatus(exportPackageId: string, approvalStatus: MessageApprovalStatus) {
    setBusyId(exportPackageId);
    setErrorById((m) => {
      const n = { ...m };
      delete n[exportPackageId];
      return n;
    });
    try {
      const res = await fetch(`/api/issues/${issueId}/exports/${exportPackageId}/approval`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approvalStatus }),
      });
      const json = (await res.json().catch(() => ({}))) as unknown;
      if (!res.ok) {
        const msg =
          typeof json === "object" && json && "error" in json ? String((json as { error: unknown }).error) : `Failed (${res.status})`;
        throw new Error(msg);
      }
      const parsed = MessageApprovalStatusSchema.safeParse(
        typeof json === "object" && json && "approvalStatus" in json ? (json as { approvalStatus: unknown }).approvalStatus : undefined,
      );
      const nextStatus = parsed.success ? parsed.data : approvalStatus;
      setRows((prev) => prev.map((r) => (r.id === exportPackageId ? { ...r, approvalStatus: nextStatus } : r)));
      router.refresh();
    } catch (e) {
      setErrorById((m) => ({
        ...m,
        [exportPackageId]: e instanceof Error ? e.message : "Update failed",
      }));
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_78%,var(--metis-surface-toolbar))] px-4 py-4 sm:px-5 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_18%,transparent)]"
      aria-label="Recent export packages"
    >
      <div className="space-y-1">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">Recent export packages</p>
        <p className="max-w-xl text-[0.72rem] leading-snug text-[--metis-paper-muted]">
          Stored snapshots from copy/download actions. Approval status is a coordination label — it does not send or circulate the package.
        </p>
      </div>

      <ul className="mt-4 min-w-0 divide-y divide-[--metis-outline-subtle]">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 py-3 first:pt-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className={approvalStatusBadgeClassNames(r.approvalStatus)} title="Coordination approval status">
                  {approvalStatusDisplayLabel(r.approvalStatus)}
                </span>
                <span className="text-xs font-medium text-[--metis-paper]">{FORMAT_LABEL[r.format] ?? r.format}</span>
                <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[--metis-ink-soft]">
                  {r.mode === "full" ? "Full" : "Executive"}
                </span>
              </div>
              <p className="truncate text-xs text-[--metis-text-secondary]" title={r.filename}>
                {r.filename}
              </p>
              <p className="text-[0.68rem] text-[--metis-paper-muted]">{new Date(r.createdAtIso).toLocaleString()}</p>
              {errorById[r.id] ? (
                <p className="text-[0.72rem] text-[--metis-status-danger-fg]" role="alert">
                  {errorById[r.id]}
                </p>
              ) : null}
            </div>

            {canUpdateApproval ? (
              <div className="min-w-0 shrink-0 sm:max-w-[14rem] sm:pt-0.5">
                <ControlField label="Set status">
                  <ControlSelect
                    aria-label={`Approval status for ${r.filename}`}
                    disabled={busyId === r.id}
                    value={r.approvalStatus}
                    onChange={(e) => {
                      void patchStatus(r.id, e.target.value as MessageApprovalStatus);
                    }}
                  >
                    {MESSAGE_APPROVAL_STATUS_ORDER.map((status) => (
                      <option key={status} value={status}>
                        {approvalStatusDisplayLabel(status)}
                      </option>
                    ))}
                  </ControlSelect>
                </ControlField>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
