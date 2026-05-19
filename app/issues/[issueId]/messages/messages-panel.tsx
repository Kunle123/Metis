"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";

import { AiProvenance } from "@/components/ui/ai-provenance";
import { Button } from "@/components/ui/button";
import { ControlField, ControlSelect } from "@/components/ui/control";
import type { MessageApprovalStatus } from "@metis/shared/approvalStatus";
import { MESSAGE_APPROVAL_STATUS_ORDER, MessageApprovalStatusSchema, approvalStatusDisplayLabel } from "@metis/shared/approvalStatus";
import type { MessageVariantArtifact, MessageVariantTemplateId } from "@metis/shared/messageVariant";
import { approvalStatusBadgeClassNames } from "@/lib/approvals/approvalStatusUi";
import { renderMessageVariantMarkdown } from "@/lib/messages/generateExternalCustomerUpdate";
import { renderInternalStaffUpdateMarkdown } from "@/lib/messages/generateInternalStaffUpdate";
import { renderMediaHoldingLineMarkdown } from "@/lib/messages/generateMediaHoldingLine";
import { AiPolishedField } from "@/components/outputs/AiPolishedField";
import { OutputWordingModeBar } from "@/components/outputs/OutputWordingModeBar";
import { MessageDraftCard } from "@/components/messages/MessageDraftCard";
import { MessageReviewRail } from "@/components/messages/MessageReviewRail";
import {
  artifactForStoredWordingCopy,
  buildMessagePolishedFields,
  buildSectionsFromDeterministicSnapshot,
  formatMessageGeneratedAt,
  getMessageOutputWordingState,
  MESSAGE_OUTPUT_WORDING_COPY,
  primarySectionLabel,
  splitMessageSectionsForDisplay,
} from "@/components/messages/messageDraftPresentation";
import {
  canSelectAiPolishedMode,
  isFieldShowingAiPolished,
  resolveOutputFieldText,
  OUTPUT_WORDING_COPY,
  type OutputWordingMode,
} from "@/lib/outputs/outputWordingMode";
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

function MessageDraftBody({
  templateId,
  sections,
  primaryBody,
  isPrimaryAiPolished,
  normalizeBodyText: normalize,
  showPrimaryOnlyNote,
}: {
  templateId: MessageVariantTemplateId;
  sections: MessageVariantArtifact["sections"];
  primaryBody: string;
  isPrimaryAiPolished: boolean;
  normalizeBodyText: (text: string) => string;
  showPrimaryOnlyNote?: boolean;
}) {
  const { primary, supporting } = splitMessageSectionsForDisplay(sections);

  return (
    <div className="min-w-0 space-y-4">
      {primary ? (
        <section className="min-w-0">
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[--metis-brass-soft]">
            {primarySectionLabel(templateId)}
          </p>
          <AiPolishedField active={isPrimaryAiPolished} className="mt-3">
            <p className="w-full min-w-0 whitespace-pre-line break-words text-[0.9375rem] leading-[1.7] text-[--metis-text-primary]">
              {normalize(primaryBody)}
            </p>
          </AiPolishedField>
        </section>
      ) : null}

      {showPrimaryOnlyNote ? (
        <p className="text-[0.68rem] leading-snug text-[--metis-text-tertiary]">
          {MESSAGE_OUTPUT_WORDING_COPY.primaryOnlyNote}
        </p>
      ) : null}

      {supporting.length ? (
        <div className="space-y-3 border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] pt-4">
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-tertiary]">
            Supporting detail & review
          </p>
          {supporting.map((s) => (
            <section key={s.id} className="min-w-0 rounded-md border border-[color-mix(in_oklab,var(--metis-outline-subtle)_80%,transparent)] bg-[color-mix(in_oklab,var(--metis-paper)_30%,transparent)] px-3 py-3">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.1em] text-[--metis-text-tertiary]">{s.title}</p>
              <p className="mt-2 w-full min-w-0 whitespace-pre-line break-words text-[0.8125rem] leading-[1.6] text-[--metis-text-secondary]">
                {normalize(s.body)}
              </p>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const MESSAGES_AI_PREPARE_FAILURE_NOTE =
  "AI-polished wording could not be prepared. Stored wording remains available.";

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
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [wordingMode, setWordingMode] = useState<OutputWordingMode>("stored");

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
    setAiNote(null);
  }, [selectedTemplateId, selectedStakeholderGroupId]);

  const outputWordingState = useMemo(
    () => (latest ? getMessageOutputWordingState(latest.artifact) : { kind: "none" as const }),
    [latest],
  );

  const polishedFields = useMemo(() => buildMessagePolishedFields(outputWordingState), [outputWordingState]);

  const canSelectAiPolished = canSelectAiPolishedMode(polishedFields);

  const showWordingControl = messagesAiCleanupEnabled;
  const isPreviewOnly = !latest;
  const wordingControlHelper = isPreviewOnly
    ? MESSAGE_OUTPUT_WORDING_COPY.previewSaveHelper
    : OUTPUT_WORDING_COPY.controlHelper;

  const storedPrimaryBody = useMemo(() => {
    if (outputWordingState.kind === "none") {
      const { primary } = splitMessageSectionsForDisplay(deterministicPreview.sections);
      return primary?.body ?? "";
    }
    return outputWordingState.storedPrimaryBody;
  }, [outputWordingState, deterministicPreview.sections]);

  const displayPrimaryBody = resolveOutputFieldText({
    mode: wordingMode,
    field: "messagePrimaryBody",
    storedText: storedPrimaryBody,
    polishedFields,
  });

  const isPrimaryAiPolished = isFieldShowingAiPolished({
    mode: wordingMode,
    field: "messagePrimaryBody",
    polishedFields,
  });

  useEffect(() => {
    if (wordingMode === "ai-polished" && !canSelectAiPolished) {
      setWordingMode("stored");
    }
  }, [wordingMode, canSelectAiPolished]);

  useEffect(() => {
    setWordingMode("stored");
  }, [selectedTemplateId, selectedStakeholderGroupId, latest?.id]);

  const storedDisplaySections = useMemo(() => {
    if (latest) {
      return buildSectionsFromDeterministicSnapshot(latest.artifact);
    }
    return deterministicPreview.sections;
  }, [latest, deterministicPreview.sections]);

  const copySourceArtifact = useMemo(() => {
    if (latest) return artifactForStoredWordingCopy(latest.artifact);
    return deterministicPreview;
  }, [latest, deterministicPreview]);

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

  const markdown = useMemo(() => {
    if (!copySourceArtifact) return "";
    if (copySourceArtifact.templateId === "internal_staff_update") {
      return renderInternalStaffUpdateMarkdown(issueTitle, copySourceArtifact);
    }
    if (copySourceArtifact.templateId === "media_holding_line") {
      return renderMediaHoldingLineMarkdown(issueTitle, copySourceArtifact);
    }
    return renderMessageVariantMarkdown(issueTitle, copySourceArtifact);
  }, [copySourceArtifact, issueTitle]);

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

  async function prepareAiPolishedWording(): Promise<boolean> {
    if (!messagesAiCleanupEnabled || !latest) return false;
    if (outputWordingState.kind === "available") return true;

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
        setAiNote(MESSAGES_AI_PREPARE_FAILURE_NOTE);
        return false;
      }

      const row = data as SavedDraftRow & { aiCleanup?: { ok: boolean; error?: string; detail?: string } };
      ingestSuccessfulVariantSave(row);

      if (row.aiCleanup?.ok === false) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[Messages AI] cleanup unsuccessful (stored draft saved)", {
            error: row.aiCleanup.error,
            detail: row.aiCleanup.detail,
          });
        }
        setAiNote(MESSAGES_AI_PREPARE_FAILURE_NOTE);
        router.refresh();
        return false;
      }

      router.refresh();
      const nextWording = getMessageOutputWordingState(row.artifact);
      if (nextWording.kind !== "available") {
        setAiNote(MESSAGE_OUTPUT_WORDING_COPY.veryClose);
        return false;
      }
      setWordingMode("ai-polished");
      return true;
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Messages AI] prepareAiPolishedWording failed", {
          ...(e instanceof Error ? { errorName: e.name, errorMessage: e.message } : { thrown: typeof e }),
        });
      }
      setAiNote(MESSAGES_AI_PREPARE_FAILURE_NOTE);
      return false;
    } finally {
      setLoading(false);
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
          latest
            ? `Copied stored wording for ${savedDraftLabel}. AI-polished display wording is not included in copy.`
            : "Copied preview wording — not a saved draft version.",
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
    </>
  ) : (
    <>Preview only — not reviewed for claim alignment until you save a numbered draft.</>
  );

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        {/* Configure (template / audience / wording) */}
        <div className="rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,transparent)] px-4 py-4 sm:px-5 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_22%,transparent)]">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
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

          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[--metis-outline-subtle] pt-3 text-xs text-[--metis-paper-muted]">
            <div className="min-w-0">
              <span className="text-[--metis-paper]">Configured:</span>{" "}
              <span className="text-[--metis-paper]">{selectedTemplateId.replaceAll("_", " ")}</span> ·{" "}
              <span className="text-[--metis-paper]">{selectedAudienceGroupLabel}</span>
              <span className="ml-2">{audienceHelperText}</span>
              {loading ? <span className="ml-2">· Preparing AI-polished wording…</span> : null}
              {aiNote ? <span className="ml-2">· {aiNote}</span> : null}
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
          headline={(latest?.artifact ?? deterministicPreview).metadata.publicHeadline}
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
                  <AiProvenance mode="original" />
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
          {showWordingControl ? (
            <OutputWordingModeBar
              wordingMode={wordingMode}
              onWordingModeChange={setWordingMode}
              canSelectAiPolished={canSelectAiPolished}
              controlHelper={wordingControlHelper}
              onPreparePolished={latest ? () => void prepareAiPolishedWording() : undefined}
              prepareActionLabel={MESSAGE_OUTPUT_WORDING_COPY.prepareAction}
              prepareLoading={loading}
              className="-mx-1 mb-4 rounded-md border border-[color-mix(in_oklab,var(--metis-outline-subtle)_80%,transparent)] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_22%,transparent)] px-3 py-2.5"
            />
          ) : null}
          {aiNote && showWordingControl ? (
            <p className="mb-3 text-[0.68rem] leading-snug text-[--metis-status-warning-fg]">{aiNote}</p>
          ) : null}
          <MessageDraftBody
            templateId={selectedTemplateId}
            sections={storedDisplaySections}
            primaryBody={displayPrimaryBody}
            isPrimaryAiPolished={isPrimaryAiPolished}
            normalizeBodyText={normalizeBodyText}
            showPrimaryOnlyNote={showWordingControl}
          />
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
