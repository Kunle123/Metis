"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MessageVariantArtifact, MessageVariantTemplateId } from "@metis/shared/messageVariant";
import { renderMessageVariantMarkdown } from "@/lib/messages/generateExternalCustomerUpdate";
import { renderInternalStaffUpdateMarkdown } from "@/lib/messages/generateInternalStaffUpdate";

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

  return (
    <div className="space-y-8">
      <div className="rounded-[1.15rem] border border-[--metis-brass]/25 bg-[rgba(164,132,82,0.08)] px-5 py-4 sm:px-6">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-brass-soft]">Showing message for</p>
        <p className="mt-1 text-base font-medium text-[--metis-paper]">{selectedLensLabel}</p>
        <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">
          Each audience keeps its own latest saved message. Change the audience above to view another lens, then generate or regenerate if none
          exists or the issue record has moved on.
        </p>
      </div>

      <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.14)] px-5 py-5 sm:px-6">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">Template</p>
        <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">
          Choose the message template. External updates avoid internal observations and source references; internal staff updates may include them.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block min-w-[min(100%,20rem)] flex-1 space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Message template</span>
            <select
              value={selectedTemplateId}
              onChange={(e) => navigateToTemplate(e.target.value as MessageVariantTemplateId)}
              className="h-11 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            >
              <option value="external_customer_resident_student">External / customer–resident–student update</option>
              <option value="internal_staff_update">Internal / staff update</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.14)] px-5 py-5 sm:px-6">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">Audience</p>
        <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">
          Organisation audience groups come from settings. Optional per-issue lens notes enrich a group when present; otherwise library defaults
          apply.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block min-w-[min(100%,20rem)] flex-1 space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Primary audience</span>
            <select
              value={selectValue}
              onChange={(e) => {
                const v = e.target.value;
                navigateToLens(v === "" ? null : v);
              }}
              className="h-11 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            >
              <option value="">Audience note from setup</option>
              {audienceGroupOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" className="h-11 rounded-full px-6" disabled={loading} onClick={() => void generate()}>
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
        </div>
      </div>

      {latest ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Version {latest.versionNumber}</span>
              <span
                className={`rounded-full border px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] ${
                  inSync
                    ? "border-emerald-400/35 bg-[rgba(18,83,58,0.45)] text-emerald-50"
                    : "border-sky-400/35 bg-[rgba(19,86,118,0.55)] text-sky-50"
                }`}
              >
                {inSync ? "Up to date with issue record" : "Stale — issue changed since generation"}
              </span>
            </div>
            <Button type="button" variant="outline" className="rounded-full" disabled={!markdown} onClick={() => void copyMd()}>
              <Copy className="mr-2 h-4 w-4" />
              {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy Markdown"}
            </Button>
          </div>

          <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.12)] px-5 py-5 sm:px-6">
            <p className="font-[Cormorant_Garamond] text-2xl text-[--metis-paper]">{latest.artifact.metadata.publicHeadline}</p>
            <p className="mt-2 text-sm text-[--metis-paper-muted]">
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

          <div className="space-y-6">
            {latest.artifact.sections.map((s) => (
              <section key={s.id} className="space-y-2 border-t border-white/8 pt-6 first:border-t-0 first:pt-0">
                <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.2em] text-[rgba(176,171,160,0.72)]">{s.title}</h3>
                <p className="whitespace-pre-line text-base leading-8 text-[--metis-paper]">{s.body}</p>
              </section>
            ))}
          </div>

          <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.18)] px-5 py-5 sm:px-6">
            <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.2em] text-[rgba(176,171,160,0.72)]">Guardrails (internal)</h3>
            <p className="mt-3 text-sm leading-7 text-[--metis-paper-muted]">{latest.artifact.guardrails.toneNotes}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-[--metis-paper-muted]">
              {latest.artifact.guardrails.mustAvoid.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.1)] px-5 py-5 sm:px-6">
          <p className="text-sm font-medium text-[--metis-paper]">No message generated for this audience yet.</p>
          <p className="mt-2 text-sm leading-7 text-[--metis-paper-muted]">
            Click &quot;Generate&quot; to create deterministic copy for <span className="text-[--metis-paper]">{selectedLensLabel}</span> from the
            current issue record.
          </p>
        </div>
      )}
    </div>
  );
}
