"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MessageVariantArtifact, MessageVariantTemplateId } from "@metis/shared/messageVariant";
import { renderMessageVariantMarkdown } from "@/lib/messages/generateExternalCustomerUpdate";
import { renderInternalStaffUpdateMarkdown } from "@/lib/messages/generateInternalStaffUpdate";
import { renderMediaHoldingLineMarkdown } from "@/lib/messages/generateMediaHoldingLine";

type AudienceGroupOption = { id: string; label: string };

type LatestPayload = {
  id: string;
  versionNumber: number;
  generatedFromIssueUpdatedAt: string;
  stakeholderGroupId: string | null;
  issueStakeholderId: string | null;
  artifact: MessageVariantArtifact;
} | null;

export function MessagesPanel({
  issueId,
  issueTitle,
  issueUpdatedAt,
  selectedTemplateId,
  audienceGroupOptions,
  selectedStakeholderGroupId,
  selectedLensLabel,
  initialLatest,
}: {
  issueId: string;
  issueTitle: string;
  issueUpdatedAt: string;
  selectedTemplateId: MessageVariantTemplateId;
  audienceGroupOptions: AudienceGroupOption[];
  /** null = setup audience note (`?lens=issue`). */
  selectedStakeholderGroupId: string | null;
  selectedLensLabel: string;
  initialLatest: LatestPayload;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [latest, setLatest] = useState<LatestPayload>(initialLatest);
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const selectValue = selectedStakeholderGroupId === null ? "" : selectedStakeholderGroupId;

  useEffect(() => {
    setLatest(initialLatest);
  }, [
    initialLatest?.id,
    initialLatest?.versionNumber,
    initialLatest?.generatedFromIssueUpdatedAt,
    initialLatest?.stakeholderGroupId,
    initialLatest?.issueStakeholderId,
    selectedStakeholderGroupId,
    selectedTemplateId,
  ]);

  const inSync = useMemo(() => {
    if (!latest) return false;
    return new Date(latest.generatedFromIssueUpdatedAt).getTime() === new Date(issueUpdatedAt).getTime();
  }, [latest, issueUpdatedAt]);

  const markdown = useMemo(() => {
    if (!latest) return "";
    if (latest.artifact.templateId === "internal_staff_update") {
      return renderInternalStaffUpdateMarkdown(issueTitle, latest.artifact);
    }
    if (latest.artifact.templateId === "media_holding_line") {
      return renderMediaHoldingLineMarkdown(issueTitle, latest.artifact);
    }
    return renderMessageVariantMarkdown(issueTitle, latest.artifact);
  }, [latest, issueTitle]);

  function navigateToLens(nextGroupId: string | null) {
    const q = nextGroupId === null ? "issue" : nextGroupId;
    router.push(`${pathname}?template=${encodeURIComponent(selectedTemplateId)}&lens=${encodeURIComponent(q)}`);
  }

  function navigateToTemplate(nextTemplateId: MessageVariantTemplateId) {
    const q = selectedStakeholderGroupId === null ? "issue" : selectedStakeholderGroupId;
    router.push(`${pathname}?template=${encodeURIComponent(nextTemplateId)}&lens=${encodeURIComponent(q)}`);
  }

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/message-variants`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          templateId: selectedTemplateId,
          stakeholderGroupId: selectedStakeholderGroupId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as unknown;
      if (!res.ok) {
        const msg =
          typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : `Failed (${res.status})`;
        throw new Error(msg);
      }
      const row = data as {
        id: string;
        versionNumber: number;
        generatedFromIssueUpdatedAt: string;
        stakeholderGroupId: string | null;
        issueStakeholderId: string | null;
        artifact: MessageVariantArtifact;
      };
      setLatest({
        id: row.id,
        versionNumber: row.versionNumber,
        generatedFromIssueUpdatedAt: row.generatedFromIssueUpdatedAt,
        stakeholderGroupId: row.stakeholderGroupId,
        issueStakeholderId: row.issueStakeholderId,
        artifact: row.artifact,
      });
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyMd() {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  const templateHelperText =
    selectedTemplateId === "internal_staff_update"
      ? "Internal draft: may include internal notes and evidence references. Internal notes are not confirmed facts. Review for sensitive or legally risky content before sharing."
      : selectedTemplateId === "media_holding_line"
        ? "Media draft: short holding line with confirmed facts only where possible; no observations or internal references. Review for sensitive or legally risky content before use."
        : "External draft: uses issue summary/confirmed facts and uncertainty wording. Still requires human review for sensitive or legally risky content.";

  return (
    <div className="space-y-5">
      <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.14)] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="rounded-full border border-amber-400/25 bg-amber-950/15 px-4 py-2 text-xs leading-5 text-amber-50/90">
              <span className="font-medium uppercase tracking-[0.16em] text-amber-200/90">Draft for review</span>
              <span className="text-amber-50/90">
                {" "}
                · Not approved for circulation. Check for sensitive, legal, personal, security, or unverified claims before using this draft in any
                channel.
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Template</span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => navigateToTemplate(e.target.value as MessageVariantTemplateId)}
                  className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                >
                  <option value="external_customer_resident_student">External / customer–resident–student update</option>
                  <option value="internal_staff_update">Internal / staff update</option>
                  <option value="media_holding_line">Media / holding line</option>
                </select>
                <p className="text-xs leading-5 text-[--metis-paper-muted]">{templateHelperText}</p>
              </label>

              <label className="space-y-1.5">
                <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Audience</span>
                <select
                  value={selectValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    navigateToLens(v === "" ? null : v);
                  }}
                  className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                >
                  <option value="">Audience note from setup</option>
                  {audienceGroupOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs leading-5 text-[--metis-paper-muted]">
                  Lens: <span className="text-[--metis-paper]">{selectedLensLabel}</span>
                </p>
              </label>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              {latest ? (
                <>
                  <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Version {latest.versionNumber}</span>
                  <span
                    className={`rounded-full border px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] ${
                      inSync
                        ? "border-emerald-400/35 bg-[rgba(18,83,58,0.45)] text-emerald-50"
                        : "border-sky-400/35 bg-[rgba(19,86,118,0.55)] text-sky-50"
                    }`}
                  >
                    {inSync ? "Up to date" : "Stale"}
                  </span>
                </>
              ) : (
                <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">No saved draft</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-10 rounded-full px-5"
                disabled={loading}
                onClick={() => void generate()}
              >
                {loading
                  ? "Generating…"
                  : latest
                    ? selectedTemplateId === "internal_staff_update"
                      ? "Regenerate staff update"
                      : "Regenerate external update"
                    : selectedTemplateId === "internal_staff_update"
                      ? "Generate staff update"
                      : "Generate external update"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full"
                disabled={!markdown}
                onClick={() => void copyMd()}
              >
                <Copy className="mr-2 h-4 w-4" />
                {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy Markdown"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {latest ? (
        <div className="space-y-4">
          <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.12)] px-4 py-4 sm:px-5">
            <p className="font-[Cormorant_Garamond] text-2xl text-[--metis-paper]">{latest.artifact.metadata.publicHeadline}</p>
            <p className="mt-1 text-sm text-[--metis-paper-muted]">
              Audience: {latest.artifact.metadata.audienceLabel} · {latest.artifact.metadata.openGapsLabel}
            </p>
            {latest.artifact.metadata.issueLevelAudienceNote ? (
              <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-950/25 px-4 py-3 text-sm leading-6 text-amber-50/95">
                {latest.artifact.metadata.issueLevelAudienceNote}
              </p>
            ) : null}
            {latest.artifact.metadata.lensEnrichmentNote ? (
              <p className="mt-3 rounded-xl border border-sky-400/20 bg-sky-950/20 px-4 py-3 text-sm leading-6 text-sky-50/95">
                {latest.artifact.metadata.lensEnrichmentNote}
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            {latest.artifact.sections.map((s) => (
              <section key={s.id} className="space-y-1.5 border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[rgba(176,171,160,0.72)]">{s.title}</h3>
                <p className="whitespace-pre-line text-sm leading-7 text-[--metis-paper]">{s.body}</p>
              </section>
            ))}
          </div>

          <details className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.18)] px-4 py-4 sm:px-5">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[rgba(176,171,160,0.72)]">Guardrails (internal)</h3>
                <span className="text-xs text-[--metis-paper-muted]">Show</span>
              </div>
            </summary>
            <div className="mt-3 space-y-3">
              <p className="text-sm leading-7 text-[--metis-paper-muted]">{latest.artifact.guardrails.toneNotes}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-[--metis-paper-muted]">
                {latest.artifact.guardrails.mustAvoid.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      ) : (
        <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.1)] px-4 py-4 sm:px-5">
          <p className="text-sm font-medium text-[--metis-paper]">No draft saved for this template + audience yet.</p>
          <p className="mt-2 text-sm leading-7 text-[--metis-paper-muted]">
            Click &quot;Generate&quot; to create deterministic copy for <span className="text-[--metis-paper]">{selectedLensLabel}</span>.
          </p>
        </div>
      )}
    </div>
  );
}
