"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";

import { AiProvenance } from "@/components/ui/ai-provenance";
import { Button } from "@/components/ui/button";
import { ControlField, ControlSelect } from "@/components/ui/control";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { MessageVariantArtifact, MessageVariantTemplateId } from "@metis/shared/messageVariant";
import { renderMessageVariantMarkdown } from "@/lib/messages/generateExternalCustomerUpdate";
import { renderInternalStaffUpdateMarkdown } from "@/lib/messages/generateInternalStaffUpdate";
import { renderMediaHoldingLineMarkdown } from "@/lib/messages/generateMediaHoldingLine";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import { ReviewBanner } from "@/components/review/ReviewBanner";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";

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

function normalizeForDiff(text: string) {
  return normalizeBodyText(text).replace(/\s+/g, " ").trim();
}

const MESSAGES_AI_USER_FAILURE_NOTE =
  "AI-enhanced wording could not be generated. Original draft is still available.";

export function MessagesPanel({
  issueId,
  issueTitle,
  issueUpdatedAt,
  selectedTemplateId,
  audienceGroupOptions,
  selectedStakeholderGroupId,
  selectedAudienceGroupLabel,
  initialLatest,
  messagesAiCleanupEnabled,
  deterministicPreview,
}: {
  issueId: string;
  issueTitle: string;
  issueUpdatedAt: string;
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
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [latest, setLatest] = useState<LatestPayload>(initialLatest);
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [aiToggleOn, setAiToggleOn] = useState(false);
  const [aiRow, setAiRow] = useState<LatestPayload>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

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

  const inSync = useMemo(() => {
    if (!latest) return false;
    return new Date(latest.generatedFromIssueUpdatedAt).getTime() === new Date(issueUpdatedAt).getTime();
  }, [latest, issueUpdatedAt]);

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

      const row = data as {
        id: string;
        versionNumber: number;
        generatedFromIssueUpdatedAt: string;
        stakeholderGroupId: string | null;
        issueStakeholderId: string | null;
        artifact: MessageVariantArtifact;
        aiCleanup?: { ok: boolean; error?: string; detail?: string };
      };

      setLatest({
        id: row.id,
        versionNumber: row.versionNumber,
        generatedFromIssueUpdatedAt: row.generatedFromIssueUpdatedAt,
        stakeholderGroupId: row.stakeholderGroupId,
        issueStakeholderId: row.issueStakeholderId,
        artifact: row.artifact,
      });

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

  const audienceHelperText =
    selectedStakeholderGroupId === null
      ? "No audience group selected. Choose an audience group from Settings → Audience groups."
      : "Using the selected audience group defaults from Settings → Audience groups.";

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(0,0,0,0.14)] px-4 py-4 sm:px-5">
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

          <div className="space-y-2">
            <SegmentedControl<"original" | "ai">
              label="Output"
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
            <div className="flex flex-wrap items-center gap-2">
              <AiProvenance mode={aiToggleOn ? "ai" : "original"} />
              <Button type="button" variant="outline" className="h-10 rounded-full" disabled={!markdown} onClick={() => void copyMd()}>
                <Copy className="mr-2 h-4 w-4" />
                {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy"}
              </Button>
            </div>
          </div>
        </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3 text-xs text-[--metis-paper-muted]">
            <div className="min-w-0">
              <span className="text-[--metis-paper]">Shaping:</span>{" "}
              <span className="text-[--metis-paper]">{selectedTemplateId.replaceAll("_", " ")}</span> ·{" "}
              <span className="text-[--metis-paper]">{selectedAudienceGroupLabel}</span>
              <span className="ml-2">{audienceHelperText}</span>
              {aiToggleOn && loading ? <span className="ml-2">· Preparing AI-enhanced…</span> : null}
              {aiNote ? <span className="ml-2">· {aiNote}</span> : null}
              {aiToggleOn && compareStats?.veryClose ? <span className="ml-2">· AI-enhanced is very close to the original.</span> : null}
            </div>
            <Link href="/audience-groups" className="text-xs text-[--metis-brass-soft] underline-offset-4 hover:underline">
              Manage audience groups →
            </Link>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(0,0,0,0.12)] px-4 py-4 sm:px-5">
          <p className="font-[Cormorant_Garamond] text-[1.55rem] leading-tight text-[--metis-paper] sm:text-[1.85rem]">
            {deterministicPreview.metadata.publicHeadline}
          </p>
        </div>

        <article className="rounded-[1.25rem] border border-white/10 bg-[rgba(0,0,0,0.10)] px-4 py-4 sm:px-5">
          <div className="space-y-5">
            {visibleArtifact.sections.map((s) => (
              <section key={s.id} className="border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                <h3 className="text-sm font-semibold text-[--metis-paper]">{s.title}</h3>
                <p className="mt-2 max-w-4xl whitespace-pre-line text-sm leading-7 text-[--metis-paper-muted]">
                  {normalizeBodyText(s.body)}
                </p>
              </section>
            ))}
          </div>
        </article>
      </div>

      <div className="min-w-0 space-y-4 xl:mt-[0.1rem]">
        <ReviewRailCard title="Persist" tone="neutral" meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Save the current deterministic draft for history and export.</p>}>
          <div className="grid gap-2">
            <Button type="button" variant="outline" className="h-10 rounded-full" disabled={loading} onClick={() => void saveDeterministicVariant()}>
              {loading ? "Saving…" : latest ? "Save updated draft" : "Save draft"}
            </Button>
            {canShowAi && aiToggleOn && aiRow ? (
              <Button type="button" variant="outline" className="h-10 rounded-full" disabled={loading} onClick={() => void ensureAiEnhanced()}>
                Refresh AI-enhanced
              </Button>
            ) : null}
          </div>
        </ReviewRailCard>

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
              {!latest ? (
                <p className="text-sm leading-6 text-[--metis-paper-muted]">
                  Choose a template and audience group to preview a draft. Save a draft version when it reads cleanly for your channel.
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Audience group</span>
                <span className="text-[--metis-paper]">{selectedAudienceGroupLabel}</span>
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
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded-full border px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] ${
                          inSync
                            ? "border-emerald-400/35 bg-[rgba(18,83,58,0.45)] text-emerald-50"
                            : "border-sky-400/35 bg-[rgba(19,86,118,0.55)] text-sky-50"
                        }`}
                      >
                        {inSync ? "Up to date" : "Stale"}
                      </span>
                      {!inSync ? (
                        <span className="max-w-[14rem] text-right text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                          Save or regenerate wording because the issue changed after this draft.
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Open questions</span>
                    <Link
                      href={`/issues/${issueId}/gaps`}
                      className="text-[--metis-paper] underline-offset-4 hover:underline"
                      title="Answer, assign, or close open questions in the tracker."
                    >
                      {deterministicPreview.metadata.openGapsLabel}
                    </Link>
                  </div>
                  <p className="border-t border-white/8 pt-3 text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                    Answer, assign, or close open questions before circulation.
                  </p>
                </>
              ) : null}
            </div>
        </ReviewRailCard>

        {/* Legacy metadata notes suppressed: Messages uses organisation-level audience groups only. */}

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
