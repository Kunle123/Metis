"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";

import { AiProvenance } from "@/components/ui/ai-provenance";
import { Button } from "@/components/ui/button";
import { ControlField, ControlSelect } from "@/components/ui/control";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { MessageApprovalStatus } from "@metis/shared/approvalStatus";
import { MESSAGE_APPROVAL_STATUS_ORDER, MessageApprovalStatusSchema, approvalStatusDisplayLabel } from "@metis/shared/approvalStatus";
import type { MessageVariantArtifact, MessageVariantTemplateId } from "@metis/shared/messageVariant";
import { approvalStatusBadgeClassNames } from "@/lib/approvals/approvalStatusUi";
import { renderMessageVariantMarkdown } from "@/lib/messages/generateExternalCustomerUpdate";
import { renderInternalStaffUpdateMarkdown } from "@/lib/messages/generateInternalStaffUpdate";
import { renderMediaHoldingLineMarkdown } from "@/lib/messages/generateMediaHoldingLine";
import { MessageDraftCard } from "@/components/messages/MessageDraftCard";
import { MessageReviewRail } from "@/components/messages/MessageReviewRail";
import { formatMessageGeneratedAt } from "@/components/messages/messageDraftPresentation";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import type { ClaimAlignmentFinding } from "@/lib/conflicts/claimAlignment";

type AudienceGroupOption = { id: string; label: string };

type ClaimAlignmentReview =
  | { mode: "saved_draft"; findings: ClaimAlignmentFinding[] }
  | { mode: "preview_only" };

type SavedDraftRow = {
  id: string;
  versionNumber: number;
  generatedFromIssueUpdatedAt: string;
  stakeholderGroupId: string | null;
  issueStakeholderId: string | null;
  artifact: MessageVariantArtifact;
  approvalStatus: MessageApprovalStatus;
  approvalUpdatedAt: string | null;
  approvalUpdatedByUserId: string | null;
};

type LatestPayload = SavedDraftRow | null;

function normalizeBodyText(text: string) {
  // Back-compat: older stored variants may contain literal "\n" sequences.
  // Normalize so the review surface shows real line breaks.
  return text.replaceAll("\\n", "\n");
}

function normalizeForDiff(text: string) {
  return normalizeBodyText(text).replace(/\s+/g, " ").trim();
}

const MESSAGES_AI_USER_FAILURE_NOTE =
  "AI-enhanced wording could not be generated. Original draft is still available.";

export function MessagesPanel({
  issueId,
  issueTitle,
  selectedTemplateId,
  audienceGroupOptions,
  selectedStakeholderGroupId,
  selectedAudienceGroupLabel,
  initialLatest,
  messagesAiCleanupEnabled,
  deterministicPreview,
  savedDraftContentInSync,
  canUpdateMessageApprovalStatus,
  claimAlignmentReview,
  claimsOnRecordCount,
}: {
  issueId: string;
  issueTitle: string;
  /** Admin/User may change coordination approval; Viewer sees read-only badge. */
  canUpdateMessageApprovalStatus: boolean;
  /** Server-derived freshness (ignores benign activity like saving this draft); false when no saved draft row. */
  savedDraftContentInSync: boolean;
  selectedTemplateId: MessageVariantTemplateId;
  audienceGroupOptions: AudienceGroupOption[];
  /** null = general / no organisation audience group; URL retains `lens` query for backwards compatibility. */
  selectedStakeholderGroupId: string | null;
  selectedAudienceGroupLabel: string;
  initialLatest: LatestPayload;
  /** Server flag MESSAGES_AI_CLEANUP_ENABLED==="true"; when false, AI toggle hidden. */
  messagesAiCleanupEnabled: boolean;
  /** Deterministic preview computed from issue record (no DB write). */
  deterministicPreview: MessageVariantArtifact;
  /** Passive heuristic review for the persisted message draft — never blocks actions. */
  claimAlignmentReview: ClaimAlignmentReview;
  /** Active claims on the issue (for provenance footer). */
  claimsOnRecordCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [latest, setLatest] = useState<LatestPayload>(initialLatest);
  const [savedDraftSynced, setSavedDraftSynced] = useState(savedDraftContentInSync);
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [aiToggleOn, setAiToggleOn] = useState(false);
  const [aiRow, setAiRow] = useState<LatestPayload>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [approvalBusy, setApprovalBusy] = useState(false);

  const selectValue = selectedStakeholderGroupId === null ? "" : selectedStakeholderGroupId;

  useEffect(() => {
    setLatest(initialLatest);
  }, [
    initialLatest?.id,
    initialLatest?.versionNumber,
    initialLatest?.generatedFromIssueUpdatedAt,
    initialLatest?.stakeholderGroupId,
    initialLatest?.issueStakeholderId,
    initialLatest?.approvalStatus,
    initialLatest?.approvalUpdatedAt,
    selectedStakeholderGroupId,
    selectedTemplateId,
  ]);

  useEffect(() => {
    setSavedDraftSynced(savedDraftContentInSync);
  }, [
    savedDraftContentInSync,
    initialLatest?.id,
    initialLatest?.versionNumber,
    initialLatest?.generatedFromIssueUpdatedAt,
    selectedStakeholderGroupId,
    selectedTemplateId,
  ]);

  useEffect(() => {
    // Changing template/audience resets AI view + cached AI row for this selection.
    setAiToggleOn(false);
    setAiRow(null);
    setAiNote(null);
  }, [selectedTemplateId, selectedStakeholderGroupId]);

  const canShowAi = Boolean(messagesAiCleanupEnabled);

  const compareStats = useMemo(() => {
    const a = aiRow?.artifact;
    if (!a) return null;
    const det = a.metadata.deterministicSectionBodiesById;
    const canCompare = Boolean(a.metadata.aiComparisonAvailable && det && typeof det === "object");
    if (!canCompare) return null;
    const changes = a.sections.filter((s) => normalizeForDiff(s.body) !== normalizeForDiff(String(det?.[s.id] ?? ""))).length;
    return { changes, total: a.sections.length, veryClose: changes === 0 };
  }, [aiRow]);

  const visibleArtifact = useMemo(() => {
    // OFF => always deterministic preview (no DB write required).
    if (!aiToggleOn) return deterministicPreview;
    // ON => show AI-enhanced if we have it; otherwise fall back to deterministic while loading/generating.
    return aiRow?.artifact ?? deterministicPreview;
  }, [aiToggleOn, aiRow, deterministicPreview]);

  const inSync = !latest ? false : savedDraftSynced;

  function ingestSuccessfulVariantSave(row: SavedDraftRow) {
    setLatest(row);
    setSavedDraftSynced(true);
  }

  async function updateApprovalStatus(next: MessageApprovalStatus) {
    if (!latest || approvalBusy || next === latest.approvalStatus) return;
    setApprovalBusy(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/message-variants/${latest.id}/approval`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approvalStatus: next }),
      });
      const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const msg = typeof raw.error === "string" ? raw.error : `Failed (${res.status})`;
        throw new Error(msg);
      }
      const st = MessageApprovalStatusSchema.safeParse(raw.approvalStatus);
      setLatest({
        ...latest,
        approvalStatus: st.success ? st.data : next,
        approvalUpdatedAt: typeof raw.approvalUpdatedAt === "string" ? raw.approvalUpdatedAt : latest.approvalUpdatedAt,
        approvalUpdatedByUserId:
          typeof raw.approvalUpdatedByUserId === "string" || raw.approvalUpdatedByUserId === null
            ? (raw.approvalUpdatedByUserId as string | null)
            : latest.approvalUpdatedByUserId,
      });
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Could not update approval status");
    } finally {
      setApprovalBusy(false);
    }
  }

  const savedDraftLabel = latest ? `Message draft v${latest.versionNumber}` : null;

  const viewingAiPolishedWording = useMemo(() => {
    return Boolean(visibleArtifact.metadata?.aiWordingPolish === "ai_polished" && aiToggleOn);
  }, [visibleArtifact.metadata?.aiWordingPolish, aiToggleOn]);

  const markdown = useMemo(() => {
    if (!visibleArtifact) return "";
    if (visibleArtifact.templateId === "internal_staff_update") {
      return renderInternalStaffUpdateMarkdown(issueTitle, visibleArtifact);
    }
    if (visibleArtifact.templateId === "media_holding_line") {
      return renderMediaHoldingLineMarkdown(issueTitle, visibleArtifact);
    }
    return renderMessageVariantMarkdown(issueTitle, visibleArtifact);
  }, [visibleArtifact, issueTitle]);

  function navigateToLens(nextGroupId: string | null) {
    const q = nextGroupId === null ? "issue" : nextGroupId;
    router.push(`${pathname}?template=${encodeURIComponent(selectedTemplateId)}&lens=${encodeURIComponent(q)}`);
  }

  function navigateToTemplate(nextTemplateId: MessageVariantTemplateId) {
    const q = selectedStakeholderGroupId === null ? "issue" : selectedStakeholderGroupId;
    router.push(`${pathname}?template=${encodeURIComponent(nextTemplateId)}&lens=${encodeURIComponent(q)}`);
  }

  async function saveDeterministicVariant() {
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
      const row = data as SavedDraftRow;
      ingestSuccessfulVariantSave(row);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function ensureAiEnhanced(): Promise<boolean> {
    if (!messagesAiCleanupEnabled) return false;
    // If we already have an AI row for this view state, keep it.
    if (aiRow?.artifact?.metadata?.aiComparisonAvailable) return true;
    setLoading(true);
    setAiNote(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/message-variants`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          templateId: selectedTemplateId,
          stakeholderGroupId: selectedStakeholderGroupId,
          improveWithAi: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as unknown;

      if (!res.ok) {
        const errObj = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
        const error = typeof errObj.error === "string" ? errObj.error : undefined;
        const detail = typeof errObj.detail === "string" ? errObj.detail : undefined;
        if (process.env.NODE_ENV === "development") {
          console.warn("[Messages AI] POST /message-variants failed", {
            status: res.status,
            error,
            detail,
            deterministicFallbackAvailable: true,
          });
        }
        setAiNote(MESSAGES_AI_USER_FAILURE_NOTE);
        return false;
      }

      const row = data as SavedDraftRow & { aiCleanup?: { ok: boolean; error?: string; detail?: string } };

      ingestSuccessfulVariantSave(row);

      if (row.aiCleanup?.ok === false) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[Messages AI] cleanup unsuccessful (deterministic variant saved)", {
            error: row.aiCleanup.error,
            detail: row.aiCleanup.detail,
            deterministicFallbackAvailable: true,
          });
        }
        setAiNote(MESSAGES_AI_USER_FAILURE_NOTE);
        router.refresh();
        return false;
      }

      setAiRow({
        id: row.id,
        versionNumber: row.versionNumber,
        generatedFromIssueUpdatedAt: row.generatedFromIssueUpdatedAt,
        stakeholderGroupId: row.stakeholderGroupId,
        issueStakeholderId: row.issueStakeholderId,
        artifact: row.artifact,
        approvalStatus: row.approvalStatus,
        approvalUpdatedAt: row.approvalUpdatedAt,
        approvalUpdatedByUserId: row.approvalUpdatedByUserId,
      });
      router.refresh();
      const hasCompare = Boolean(row.artifact.metadata.aiComparisonAvailable && row.artifact.metadata.deterministicSectionBodiesById);
      if (!hasCompare) {
        setAiNote("AI-enhanced text was very close to the original; showing the original draft.");
        return false;
      }
      return true;
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Messages AI] ensureAiEnhanced failed", {
          deterministicFallbackAvailable: true,
          ...(e instanceof Error ? { errorName: e.name, errorMessage: e.message } : { thrown: typeof e }),
        });
      }
      setAiNote(MESSAGES_AI_USER_FAILURE_NOTE);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function toggleAi(nextOn: boolean) {
    setAiNote(null);
    if (!nextOn) {
      setAiToggleOn(false);
      return;
    }
    // Turning ON should lazily generate/cached AI-enhanced version.
    setAiToggleOn(true);
    const ok = await ensureAiEnhanced();
    if (!ok) {
      setAiToggleOn(false);
    }
  }

  async function copyMd() {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyState("copied");
      if (!latest) {
        setCopyFeedback("Copied preview is not a saved draft version.");
      } else {
        setCopyFeedback(
          viewingAiPolishedWording
            ? `Copied AI-enhanced wording for ${savedDraftLabel}. Alternate wording only — not a separate draft or higher-truth version.`
            : `Copied original wording for ${savedDraftLabel}.`,
        );
      }
      setTimeout(() => {
        setCopyState("idle");
        setCopyFeedback(null);
      }, 3200);
    } catch {
      setCopyState("error");
      setCopyFeedback(null);
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  const templateHelperText =
    selectedTemplateId === "internal_staff_update"
      ? "Internal draft: may include internal notes and evidence references. Internal notes are not confirmed facts. Review for sensitive or legally risky content before sharing."
      : selectedTemplateId === "media_holding_line"
        ? "Media draft: short holding line with confirmed facts only where possible; no observations or internal references. Review for sensitive or legally risky content before use."
        : "External draft: uses issue summary/confirmed facts and uncertainty wording. Still requires human review for sensitive or legally risky content.";

  const audienceHelperText =
    selectedStakeholderGroupId === null
      ? "No audience group selected. Choose an audience group from Settings → Audience groups."
      : "Using the selected audience group defaults from Settings → Audience groups.";

  const claimFindings =
    claimAlignmentReview.mode === "saved_draft" ? claimAlignmentReview.findings : [];

  const provenanceLine = (() => {
    const parts: string[] = [];
    const generatedLabel = formatMessageGeneratedAt(latest?.generatedFromIssueUpdatedAt);
    if (generatedLabel) {
      parts.push(`Generated from the issue record · saved snapshot ${generatedLabel}`);
    } else {
      parts.push("Generated from the current issue record and selected audience context.");
    }
    if (claimsOnRecordCount > 0) {
      parts.push(`${claimsOnRecordCount} claim${claimsOnRecordCount === 1 ? "" : "s"} on register`);
    }
    parts.push(deterministicPreview.metadata.openGapsLabel);
    return parts.join(" · ");
  })();

  const draftStatusNote = latest ? (
    <>
      {inSync ? (
        <>
          Saved <span className="text-[--metis-text-primary]">{savedDraftLabel}</span> reflects the current issue snapshot for this template and audience.
        </>
      ) : (
        <>
          <span className="text-[--metis-status-warning-fg]">Needs refresh</span> — issue changed after this draft was saved. Use{" "}
          <span className="text-[--metis-text-primary]">Refresh saved draft</span> to regenerate from the record.
        </>
      )}
      {viewingAiPolishedWording ? (
        <span className="mt-1 block">AI-enhanced wording is an alternate view — not a separate approved version.</span>
      ) : null}
    </>
  ) : (
    <>Preview only — not reviewed for claim alignment until you save a numbered draft.</>
  );

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        {/* Configure (template / audience / wording) */}
        <div className="rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,transparent)] px-4 py-4 sm:px-5 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_22%,transparent)]">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ControlField label="Template">
              <ControlSelect
                aria-label="Message template"
                value={selectedTemplateId}
                onChange={(e) => navigateToTemplate(e.target.value as MessageVariantTemplateId)}
              >
                <option value="external_customer_resident_student">External / customer–resident–student update</option>
                <option value="internal_staff_update">Internal / staff update</option>
                <option value="media_holding_line">Media / holding line</option>
              </ControlSelect>
            </ControlField>

            <ControlField label="Audience group">
              <ControlSelect
                aria-label="Audience group"
                value={selectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  navigateToLens(v === "" ? null : v);
                }}
              >
                <option value="">General (no audience group)</option>
                {audienceGroupOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </ControlSelect>
            </ControlField>

            <SegmentedControl<"original" | "ai">
              label="Wording"
              disabled={loading}
              value={aiToggleOn ? "ai" : "original"}
              options={[
                { id: "original", label: "Original" },
                { id: "ai", label: "AI-enhanced", disabled: !canShowAi },
              ]}
              onChange={(next) => {
                if (next === "original") void toggleAi(false);
                else void toggleAi(true);
              }}
              className="min-w-0 lg:max-w-xl"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[--metis-outline-subtle] pt-3 text-xs text-[--metis-paper-muted]">
            <div className="min-w-0">
              <span className="text-[--metis-paper]">Configured:</span>{" "}
              <span className="text-[--metis-paper]">{selectedTemplateId.replaceAll("_", " ")}</span> ·{" "}
              <span className="text-[--metis-paper]">{selectedAudienceGroupLabel}</span>
              <span className="ml-2">{audienceHelperText}</span>
              {aiToggleOn && loading ? <span className="ml-2">· Preparing AI wording…</span> : null}
              {aiNote ? <span className="ml-2">· {aiNote}</span> : null}
              {aiToggleOn && compareStats?.veryClose ? <span className="ml-2">· AI wording is very close to the original.</span> : null}
            </div>
            <Link href="/audience-groups" className="text-xs text-[--metis-brass-soft] underline-offset-4 hover:underline">
              Manage audience groups →
            </Link>
          </div>
        </div>

        <MessageDraftCard
          templateId={selectedTemplateId}
          audienceLabel={selectedAudienceGroupLabel}
          hasSavedDraft={Boolean(latest)}
          savedDraftLabel={savedDraftLabel}
          inSync={inSync}
          approvalStatus={latest?.approvalStatus ?? null}
          claimFindingCount={claimFindings.length}
          headline={visibleArtifact.metadata.publicHeadline}
          provenanceLine={provenanceLine}
          statusNote={draftStatusNote}
          controls={
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={!latest || !inSync ? "default" : "outline"}
                    size="sm"
                    disabled={loading}
                    onClick={() => void saveDeterministicVariant()}
                  >
                    {loading ? "Saving…" : !latest ? "Save draft" : inSync ? "Save new version" : "Refresh saved draft"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={!markdown} onClick={() => void copyMd()}>
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy"}
                  </Button>
                  {canShowAi && aiToggleOn && aiRow ? (
                    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void ensureAiEnhanced()}>
                      Refresh AI wording
                    </Button>
                  ) : null}
                  <AiProvenance mode={aiToggleOn ? "ai" : "original"} />
                </div>
                <p className="min-w-0 text-[0.72rem] leading-snug text-[--metis-text-tertiary]">
                  {!latest ? "Copying preview does not create a saved version." : !inSync ? "Refresh regenerates from the latest issue snapshot." : "Save new version when wording should be re-derived."}
                  {copyFeedback ? (
                    <span className="ml-2 text-[--metis-text-secondary]" role="status">
                      {copyFeedback}
                    </span>
                  ) : null}
                </p>
              </div>
              {latest ? (
                <div className="flex flex-col gap-2 border-t border-[--metis-outline-subtle] pt-3 sm:flex-row sm:items-end sm:justify-between">
                  <p className="max-w-md text-[0.72rem] leading-snug text-[--metis-text-tertiary]">
                    Coordination approval — does not send the message.
                    {(latest.approvalStatus === "Approved" || latest.approvalStatus === "ReadyToCirculate") && (
                      <span> Not legal sign-off unless your organisation defines it that way.</span>
                    )}
                  </p>
                  {canUpdateMessageApprovalStatus ? (
                    <div className="min-w-0 w-full max-w-xs">
                      <ControlField label="Approval workflow">
                        <ControlSelect
                          aria-label="Message draft approval status"
                          disabled={approvalBusy}
                          value={latest.approvalStatus}
                          onChange={(e) => void updateApprovalStatus(e.target.value as MessageApprovalStatus)}
                        >
                          {MESSAGE_APPROVAL_STATUS_ORDER.map((s) => (
                            <option key={s} value={s}>
                              {approvalStatusDisplayLabel(s)}
                            </option>
                          ))}
                        </ControlSelect>
                      </ControlField>
                    </div>
                  ) : (
                    <span className={approvalStatusBadgeClassNames(latest.approvalStatus)}>{approvalStatusDisplayLabel(latest.approvalStatus)}</span>
                  )}
                </div>
              ) : null}
            </div>
          }
        >
          <div className="space-y-4">
            {visibleArtifact.sections.map((s) => (
              <section key={s.id} className="border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] pt-3.5 first:border-t-0 first:pt-0">
                <p className="text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-tertiary]">{s.title}</p>
                <p className="mt-2 max-w-prose whitespace-pre-line text-[0.875rem] leading-[1.65] text-[--metis-text-secondary]">
                  {normalizeBodyText(s.body)}
                </p>
              </section>
            ))}
          </div>
        </MessageDraftCard>
      </div>

      <div className="min-w-0 space-y-4 xl:mt-[0.1rem]">
        <MessageReviewRail
          issueId={issueId}
          hasSavedDraft={Boolean(latest)}
          inSync={inSync}
          approvalStatus={latest?.approvalStatus ?? null}
          audienceLabel={selectedAudienceGroupLabel}
          templateHelperText={templateHelperText}
          openGapsLabel={deterministicPreview.metadata.openGapsLabel}
          claimAlignmentMode={claimAlignmentReview.mode}
          findings={claimFindings}
        />

                <ReviewRailCard
          title="Next steps"
          tone="neutral"
          meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Optional — no required workflow. Use when you’re ready.</p>}
        >
          <div className="grid gap-2">
            <Link
              href={`/issues/${issueId}/export`}
              className="rounded-[1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,transparent)] px-3 py-2 text-sm text-[--metis-paper] underline-offset-4 hover:underline"
            >
              Circulation package &amp; export →
            </Link>
            <Link
              href={`/issues/${issueId}/comms-plan`}
              className="rounded-[1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,transparent)] px-3 py-2 text-sm text-[--metis-paper] underline-offset-4 hover:underline"
            >
              Comms plan →
            </Link>
          </div>
        </ReviewRailCard>

        {/* Legacy metadata notes suppressed: Messages uses organisation-level audience groups only. */}

        <CollapsibleSection
          className="border-[--metis-info-border] bg-[--metis-info-bg]"
          summary={
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[--metis-text-tertiary]">
                Guardrails (internal)
              </h3>
              <span className="text-xs text-[--metis-paper-muted]">Show</span>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-sm leading-7 text-[--metis-paper-muted]">{deterministicPreview.guardrails.toneNotes}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-[--metis-paper-muted]">
              {deterministicPreview.guardrails.mustAvoid.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
