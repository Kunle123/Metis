"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MessageVariantArtifact, MessageVariantTemplateId } from "@metis/shared/messageVariant";
import { renderMessageVariantMarkdown } from "@/lib/messages/generateExternalCustomerUpdate";
import { renderInternalStaffUpdateMarkdown } from "@/lib/messages/generateInternalStaffUpdate";
import { renderMediaHoldingLineMarkdown } from "@/lib/messages/generateMediaHoldingLine";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import { DenseSection } from "@/components/review/DenseSection";
import { ReviewBanner } from "@/components/review/ReviewBanner";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { ReviewToolbar } from "@/components/review/ReviewToolbar";

type AudienceGroupOption = { id: string; label: string };

type LatestPayload = {
  id: string;
  versionNumber: number;
  generatedFromIssueUpdatedAt: string;
  stakeholderGroupId: string | null;
  issueStakeholderId: string | null;
  artifact: MessageVariantArtifact;
} | null;

function normalizeBodyText(text: string) {
  // Back-compat: older stored variants may contain literal "\n" sequences.
  // Normalize so the review surface shows real line breaks.
  return text.replaceAll("\\n", "\n");
}

export function MessagesPanel({
  issueId,
  issueTitle,
  issueUpdatedAt,
  selectedTemplateId,
  audienceGroupOptions,
  selectedStakeholderGroupId,
  selectedLensLabel,
  selectedLensStatus,
  setupAudienceNote,
  initialLatest,
}: {
  issueId: string;
  issueTitle: string;
  issueUpdatedAt: string;
  selectedTemplateId: MessageVariantTemplateId;
  audienceGroupOptions: Array<AudienceGroupOption & { status: "complete" | "needs_guidance" }>;
  /** null = setup audience note (`?lens=issue`). */
  selectedStakeholderGroupId: string | null;
  selectedLensLabel: string;
  selectedLensStatus: "complete" | "needs_guidance" | "setup_note" | "setup_missing";
  setupAudienceNote: string;
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

  const lensHelperText = (() => {
    if (selectedLensStatus === "setup_missing") {
      return "Using setup audience note only (none recorded yet). Add it in setup to tailor language and emphasis.";
    }
    if (selectedLensStatus === "setup_note") {
      return setupAudienceNote ? `Using setup audience note only: ${setupAudienceNote}` : "Using setup audience note only.";
    }
    if (selectedLensStatus === "needs_guidance") {
      return "No issue-specific guidance is recorded for this audience. This message may be generic; add stakeholder guidance to tailor it further.";
    }
    return "Using stakeholder guidance recorded for this issue.";
  })();

  const lensIndicator = (() => {
    if (selectedLensStatus === "complete") return { tone: "ok" as const, label: "Using guidance" };
    if (selectedLensStatus === "needs_guidance") return { tone: "warn" as const, label: "Needs guidance" };
    if (selectedLensStatus === "setup_missing") return { tone: "warn" as const, label: "Setup note missing" };
    return { tone: "info" as const, label: "Setup note only" };
  })();

  const showGuidanceCta = selectedLensStatus !== "complete";

  return (
    <div className="space-y-5">
      <ReviewToolbar
        left={
          <div className="space-y-3">
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
                  <option value="">Setup audience note (issue)</option>
                  {audienceGroupOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.status === "complete" ? `${o.label} ✓ guidance` : `${o.label} · needs guidance`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="text-sm leading-6 text-[--metis-paper-muted]">
              <span className="text-[--metis-paper]">Shaping context:</span>{" "}
              <span className="text-[--metis-paper]">{selectedTemplateId.replaceAll("_", " ")}</span> ·{" "}
              <span className="text-[--metis-paper]">{selectedLensLabel}</span>{" "}
              <span
                className={`ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.16em] ${
                  lensIndicator.tone === "ok"
                    ? "border-emerald-400/30 bg-[rgba(18,83,58,0.35)] text-emerald-50"
                    : lensIndicator.tone === "warn"
                      ? "border-amber-400/35 bg-[rgba(131,82,17,0.42)] text-amber-50"
                      : "border-sky-400/35 bg-[rgba(19,86,118,0.42)] text-sky-50"
                }`}
              >
                {lensIndicator.label}
              </span>
              <div className="mt-1 text-[--metis-paper-muted]">{lensHelperText}</div>
              {showGuidanceCta ? (
                <div className="mt-2">
                  <Link
                    href={`/issues/${encodeURIComponent(issueId)}#stakeholders`}
                    className="text-sm text-[--metis-brass-soft] underline-offset-4 hover:underline"
                  >
                    Add stakeholder guidance →
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        }
        right={
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Button type="button" className="h-10 rounded-full px-5" disabled={loading} onClick={() => void generate()}>
              {loading
                ? "Generating…"
                : latest
                  ? selectedTemplateId === "internal_staff_update"
                    ? "Regenerate staff update"
                    : selectedTemplateId === "media_holding_line"
                      ? "Regenerate holding line"
                      : "Regenerate external update"
                  : selectedTemplateId === "internal_staff_update"
                    ? "Generate staff update"
                    : selectedTemplateId === "media_holding_line"
                      ? "Generate holding line"
                      : "Generate external update"}
            </Button>
            <Button type="button" variant="outline" className="h-10 rounded-full" disabled={!markdown} onClick={() => void copyMd()}>
              <Copy className="mr-2 h-4 w-4" />
              {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy Markdown"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {latest ? (
            <div className="space-y-4">
              <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.12)] px-4 py-4 sm:px-5">
                <p className="font-[Cormorant_Garamond] text-2xl text-[--metis-paper]">{latest.artifact.metadata.publicHeadline}</p>
              </div>

              <div className="space-y-4">
                {latest.artifact.sections.map((s, idx) => (
                  <DenseSection key={s.id} title={s.title} className={idx === 0 ? "border-t-0 pt-0" : undefined}>
                    <p className="max-w-4xl whitespace-pre-line">{normalizeBodyText(s.body)}</p>
                  </DenseSection>
                ))}
              </div>
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

        <div className="space-y-4">
          <ReviewRailCard
            title="Draft status"
            tone="info"
            meta={
              <ReviewBanner
                title="Draft for review"
                body="Not approved for circulation. Check for sensitive, legal, personal, security, or unverified claims before using this draft in any channel."
                tone="warning"
              />
            }
          >
            <div className="space-y-3 text-sm leading-6 text-[--metis-paper-muted]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Lens</span>
                <span className="text-[--metis-paper]">{selectedLensLabel}</span>
              </div>
              <div className="border-t border-white/8 pt-3 text-sm leading-6 text-[--metis-paper-muted]">{templateHelperText}</div>
              {latest ? (
                <>
                  <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Version</span>
                    <span className="text-[--metis-paper]">{latest.versionNumber}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Status</span>
                    <span
                      className={`rounded-full border px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] ${
                        inSync
                          ? "border-emerald-400/35 bg-[rgba(18,83,58,0.45)] text-emerald-50"
                          : "border-sky-400/35 bg-[rgba(19,86,118,0.55)] text-sky-50"
                      }`}
                    >
                      {inSync ? "Up to date" : "Stale"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Open questions</span>
                    <span className="text-[--metis-paper]">{latest.artifact.metadata.openGapsLabel}</span>
                  </div>
                </>
              ) : null}
            </div>
          </ReviewRailCard>

          {latest?.artifact.metadata.issueLevelAudienceNote ? (
            <ReviewRailCard title="Setup note" tone="info" meta={<span>{latest.artifact.metadata.issueLevelAudienceNote}</span>}>
              <div />
            </ReviewRailCard>
          ) : null}

          {latest?.artifact.metadata.lensEnrichmentNote ? (
            <ReviewRailCard
              title="Audience guidance note"
              tone="info"
              meta={<span>{latest.artifact.metadata.lensEnrichmentNote}</span>}
            >
              <div />
            </ReviewRailCard>
          ) : null}

          {latest ? (
            <CollapsibleSection
              className="border-[--metis-info-border] bg-[--metis-info-bg]"
              summary={
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[rgba(176,171,160,0.72)]">
                    Guardrails (internal)
                  </h3>
                  <span className="text-xs text-[--metis-paper-muted]">Show</span>
                </div>
              }
            >
              <div className="space-y-3">
                <p className="text-sm leading-7 text-[--metis-paper-muted]">{latest.artifact.guardrails.toneNotes}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-[--metis-paper-muted]">
                  {latest.artifact.guardrails.mustAvoid.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </CollapsibleSection>
          ) : null}
        </div>
      </div>
    </div>
  );
}
