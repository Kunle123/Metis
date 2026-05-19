"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ClaimStatusSchema } from "@metis/shared/claim";
import { BackToIssueRecordLink } from "@/components/issues/BackToIssueRecordLink";
import { RecordCodeHint } from "@/components/issues/RecordCodeHint";
import { SurfaceCard } from "@/components/MetisShell";
import { Button } from "@/components/ui/button";
import { claimStatusBadgeClassNames, claimStatusDisplayLabel } from "@/lib/claims/claimStatusUi";
import { formatGapCode, formatObservationCode } from "@/lib/issueRecordCodes";
import type { SerializedClaim } from "@/lib/claims/serializeClaimsForViewer";

import { CollapsibleFormPanel } from "../collapsible-form-panel";

type SourceOpt = { id: string; sourceCode: string; hint?: string | null };
type GapOpt = { id: string; gapNumber: number | null; hint?: string | null };
type ObsOpt = { id: string; observationNumber: number; role: string; name: string };

function formatIsoShortLondon(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", dateStyle: "short", timeStyle: "short" }).format(d);
}

const CLAIM_STATUSES = ClaimStatusSchema.options;

/** Quiet record-code chip for `CLM-###`. */
const CLAIM_CODE_CHIP =
  "inline-flex shrink-0 rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_58%,transparent)] px-2.5 py-0.5 text-[0.68rem] font-medium uppercase tracking-[0.04em] text-[--metis-text-tertiary]";

export function ClaimLedger(props: {
  issueId: string;
  canWrite: boolean;
  claims: SerializedClaim[];
  sources: SourceOpt[];
  gaps: GapOpt[];
  observations: ObsOpt[];
}) {
  const { issueId, canWrite, claims, sources, gaps, observations } = props;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [createText, setCreateText] = useState("");
  const [createStatus, setCreateStatus] = useState<(typeof CLAIM_STATUSES)[number]>("NeedsValidation");
  const [createNotes, setCreateNotes] = useState("");
  const [createSources, setCreateSources] = useState<string[]>([]);
  const [createGaps, setCreateGaps] = useState<string[]>([]);
  const [createObs, setCreateObs] = useState<string[]>([]);

  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editStatus, setEditStatus] = useState<(typeof CLAIM_STATUSES)[number]>("NeedsValidation");
  const [editNotes, setEditNotes] = useState("");
  const [editSources, setEditSources] = useState<string[]>([]);
  const [editGaps, setEditGaps] = useState<string[]>([]);
  const [editObs, setEditObs] = useState<string[]>([]);

  function toggleId(ids: string[], id: string, setter: (v: string[]) => void) {
    if (ids.includes(id)) setter(ids.filter((x) => x !== id));
    else setter([...ids, id]);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createText.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/claims`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: createText.trim(),
          status: createStatus,
          notes: createNotes.trim() ? createNotes.trim() : null,
          sourceIds: createSources,
          gapIds: createGaps,
          internalInputIds: createObs,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof j.error === "string" ? j.error : "Could not create claim.");
      }
      setCreateText("");
      setCreateNotes("");
      setCreateSources([]);
      setCreateGaps([]);
      setCreateObs([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create claim.");
    } finally {
      setBusy(false);
    }
  }

  function beginEdit(row: SerializedClaim) {
    setEditId(row.id);
    setEditText(row.text);
    setEditStatus(row.status);
    setEditNotes(row.notes ?? "");
    setEditSources(row.links.sources.map((s) => s.sourceId));
    setEditGaps(row.links.gaps.map((g) => g.gapId));
    setEditObs(row.links.observations.filter((o) => o.kind === "observation").map((o) => o.observationId));
    setError(null);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editText.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/claims/${editId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: editText.trim(),
          status: editStatus,
          notes: editNotes.trim() ? editNotes.trim() : null,
          sourceIds: editSources,
          gapIds: editGaps,
          internalInputIds: editObs,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof j.error === "string" ? j.error : "Could not save claim.");
      }
      setEditId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save claim.");
    } finally {
      setBusy(false);
    }
  }

  function linkSummary(row: SerializedClaim): string {
    const srcLabels = row.links.sources.map((s) => s.sourceCode || "SRC").filter(Boolean);
    const gapLabels = row.links.gaps.map((g) => g.gapLabel);
    const obsParts: string[] = [];
    for (const o of row.links.observations) {
      if (o.kind === "observation_restricted") obsParts.push("Restricted observation link");
      else obsParts.push(o.code);
    }
    const chunks: string[] = [];
    if (srcLabels.length) chunks.push(`Sources: ${srcLabels.join(", ")}`);
    if (gapLabels.length) chunks.push(`Open questions: ${gapLabels.join(", ")}`);
    if (obsParts.length) chunks.push(`Observations: ${obsParts.join(", ")}`);
    return chunks.length ? chunks.join(" · ") : "No evidence links.";
  }

  function evidenceFieldset(opts: {
    title: string;
    sourceIds: string[];
    gapIds: string[];
    obsIds: string[];
    setSourceIds: (v: string[]) => void;
    setGapIds: (v: string[]) => void;
    setObsIds: (v: string[]) => void;
  }) {
    return (
      <fieldset className="space-y-3 rounded-xl border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,transparent)] p-4">
        <legend className="px-1 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-tertiary]">{opts.title}</legend>
        {sources.length > 0 ? (
          <div className="space-y-1">
            <p className="text-[0.72rem] text-[--metis-paper-muted]">Sources</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[--metis-outline-subtle] px-2 py-1 text-[0.72rem] text-[--metis-paper]">
                  <input
                    type="checkbox"
                    checked={opts.sourceIds.includes(s.id)}
                    onChange={() => toggleId(opts.sourceIds, s.id, opts.setSourceIds)}
                    className="accent-[--metis-brass]"
                  />
                  <RecordCodeHint codeLabel={s.sourceCode} hint={s.hint}>
                    {s.sourceCode}
                  </RecordCodeHint>
                </label>
              ))}
            </div>
          </div>
        ) : null}
        {gaps.length > 0 ? (
          <div className="space-y-1">
            <p className="text-[0.72rem] text-[--metis-paper-muted]">Open questions</p>
            <div className="flex flex-wrap gap-2">
              {gaps.map((g) => {
                const gapCode = formatGapCode(g.gapNumber) ?? `Q-${g.id.slice(0, 6)}`;
                return (
                  <label key={g.id} className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[--metis-outline-subtle] px-2 py-1 text-[0.72rem] text-[--metis-paper]">
                    <input
                      type="checkbox"
                      checked={opts.gapIds.includes(g.id)}
                      onChange={() => toggleId(opts.gapIds, g.id, opts.setGapIds)}
                      className="accent-[--metis-brass]"
                    />
                    <RecordCodeHint codeLabel={gapCode} hint={g.hint}>
                      {gapCode}
                    </RecordCodeHint>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
        {observations.length > 0 ? (
          <div className="space-y-1">
            <p className="text-[0.72rem] text-[--metis-paper-muted]">Observations (visible to you)</p>
            <div className="flex flex-wrap gap-2">
              {observations.map((o) => {
                const code = formatObservationCode(o.observationNumber) ?? `OBS-${o.observationNumber}`;
                const label = `${code} · ${o.role} · ${o.name}`;
                return (
                  <label key={o.id} className="flex max-w-full cursor-pointer items-center gap-1.5 rounded-md border border-[--metis-outline-subtle] px-2 py-1 text-[0.72rem] text-[--metis-paper]">
                    <input
                      type="checkbox"
                      checked={opts.obsIds.includes(o.id)}
                      onChange={() => toggleId(opts.obsIds, o.id, opts.setObsIds)}
                      className="accent-[--metis-brass]"
                    />
                    <span className="min-w-0 truncate">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
        {!sources.length && !gaps.length ? (
          <p className="text-[0.72rem] text-[--metis-paper-muted]">
            Link evidence after you record{" "}
            <Link href={`/issues/${issueId}/sources`} className="underline-offset-4 hover:underline">
              Sources
            </Link>{" "}
            or{" "}
            <Link href={`/issues/${issueId}/gaps`} className="underline-offset-4 hover:underline">
              Open questions
            </Link>
            .
          </p>
        ) : null}
      </fieldset>
    );
  }

  return (
    <SurfaceCard className="overflow-hidden">
      <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-6 py-4 sm:px-7">
        <BackToIssueRecordLink issueId={issueId} className="mb-3" />
        <h2 className="font-[Cormorant_Garamond] text-[1.85rem] leading-none text-[--metis-paper]">Claims</h2>
        <p className="mt-2 max-w-[46rem] text-sm leading-relaxed text-[--metis-paper-muted]">
          Claims are statements the organisation may rely on. Use statuses to separate confirmed facts from assumptions and items needing validation.
          Do not paste restricted observation content into claim text unless the wording is safe for everyone in this workspace — links you cannot access show as restricted and never expose codes or text.
        </p>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-7">
        {error ? (
          <p className="rounded-lg border border-[--metis-status-danger-border] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_42%,transparent)] px-4 py-2 text-sm text-[--metis-status-danger-fg]">
            {error}
          </p>
        ) : null}

        <div className="rounded-xl border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_70%,transparent)] px-5 py-4 text-[0.8rem] leading-relaxed text-[--metis-text-secondary]">
          <strong className="text-[--metis-paper-muted]">Visibility:</strong> all organisation members read claims here. Editors with write access maintain the register; viewers cannot change entries. Superseded replaces delete for auditability.
        </div>

        {canWrite ? (
          <CollapsibleFormPanel
            title="Record a new claim"
            description="Facts, assumptions, and validation items feed brief and message drafts when generation runs."
            addLabel="Add claim"
            defaultExpanded={claims.length === 0}
            form={
              <form onSubmit={submitCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[0.72rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Claim text</label>
                  <textarea
                    value={createText}
                    onChange={(e) => setCreateText(e.target.value)}
                    rows={4}
                    className="min-h-[5.5rem] w-full resize-y rounded-lg border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_35%,transparent)] px-4 py-3 text-sm leading-7 text-[--metis-paper] outline-none placeholder:text-[--metis-text-tertiary] focus-visible:border-[--metis-outline-strong] focus-visible:ring-2 focus-visible:ring-[--metis-brass]/45"
                    placeholder="State the proposition clearly — what we believe we can rely on."
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[0.72rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Status</label>
                    <select
                      value={createStatus}
                      onChange={(e) => setCreateStatus(e.target.value as (typeof CLAIM_STATUSES)[number])}
                      className="w-full rounded-lg border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,transparent)] px-4 py-2.5 text-sm text-[--metis-paper] outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/45"
                    >
                      {CLAIM_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {claimStatusDisplayLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.72rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">
                      Notes / rationale (optional)
                    </label>
                    <textarea
                      value={createNotes}
                      onChange={(e) => setCreateNotes(e.target.value)}
                      rows={3}
                      className="min-h-[4rem] w-full resize-y rounded-lg border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_35%,transparent)] px-4 py-3 text-sm text-[--metis-paper] outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/45"
                    />
                  </div>
                </div>
                {evidenceFieldset({
                  title: "Optional evidence links",
                  sourceIds: createSources,
                  gapIds: createGaps,
                  obsIds: createObs,
                  setSourceIds: setCreateSources,
                  setGapIds: setCreateGaps,
                  setObsIds: setCreateObs,
                })}
                <Button type="submit" disabled={busy}>
                  Save claim
                </Button>
              </form>
            }
          >
            {null}
          </CollapsibleFormPanel>
        ) : null}

        <div className="space-y-3">
          <h3 className="font-[Cormorant_Garamond] text-[1.25rem] text-[--metis-paper]">Register</h3>
          {claims.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_32%,transparent)] px-6 py-8 text-center text-sm text-[--metis-paper-muted]">
              No claims yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {claims.map((row) =>
                editId === row.id && canWrite ? (
                  <li
                    key={row.id}
                    className="rounded-[1.15rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_62%,transparent)] p-5"
                  >
                    <form onSubmit={submitEdit} className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <RecordCodeHint codeLabel={row.claimCode} hint={row.text} className={CLAIM_CODE_CHIP}>
                          {row.claimCode}
                        </RecordCodeHint>
                        <button
                          type="button"
                          onClick={() => setEditId(null)}
                          className="text-[0.75rem] text-[--metis-brass-soft] underline-offset-4 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[0.72rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Claim text</label>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                          className="min-h-[5rem] w-full resize-y rounded-lg border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_76%,transparent)] px-4 py-3 text-sm text-[--metis-paper] outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/45"
                          required
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-[0.72rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as (typeof CLAIM_STATUSES)[number])}
                            className="w-full rounded-lg border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_76%,transparent)] px-4 py-2 text-sm text-[--metis-paper] outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/45"
                          >
                            {CLAIM_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {claimStatusDisplayLabel(s)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[0.72rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Notes</label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={3}
                            className="min-h-[4rem] w-full resize-y rounded-lg border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_76%,transparent)] px-4 py-2 text-sm text-[--metis-paper] outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/45"
                          />
                        </div>
                      </div>
                      {evidenceFieldset({
                        title: "Evidence links",
                        sourceIds: editSources,
                        gapIds: editGaps,
                        obsIds: editObs,
                        setSourceIds: setEditSources,
                        setGapIds: setEditGaps,
                        setObsIds: setEditObs,
                      })}
                      <Button type="submit" disabled={busy}>
                        Update claim
                      </Button>
                    </form>
                  </li>
                ) : (
                  <li
                    key={row.id}
                    className="rounded-[1.15rem] border border-[color-mix(in_oklab,var(--metis-outline-subtle)_90%,transparent)] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_72%,transparent)] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <RecordCodeHint codeLabel={row.claimCode} hint={row.text} className={CLAIM_CODE_CHIP}>
                          {row.claimCode}
                        </RecordCodeHint>
                        <span className={claimStatusBadgeClassNames(row.status)}>{claimStatusDisplayLabel(row.status)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[0.72rem] text-[--metis-text-tertiary]">Updated {formatIsoShortLondon(row.updatedAt)}</span>
                        {canWrite ? (
                          <Button variant="outline" type="button" size="sm" onClick={() => beginEdit(row)}>
                            Edit
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[--metis-paper]">{row.text}</p>
                    {row.notes ? (
                      <p className="mt-2 whitespace-pre-wrap text-[0.8rem] leading-6 text-[--metis-paper-muted]">
                        <span className="font-medium text-[--metis-text-tertiary]">Notes: </span>
                        {row.notes}
                      </p>
                    ) : null}
                    <p className="mt-3 text-[0.75rem] leading-5 text-[--metis-text-secondary]">{linkSummary(row)}</p>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}
