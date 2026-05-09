"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AiProvenance } from "@/components/ui/ai-provenance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { NormalizedAlternateWording } from "@/lib/brief/alternateWording";

type CompareVariant = "original" | "alternate";

type PolishPreviewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "disabled"; message: string }
  | {
      kind: "ready";
      text: string;
      limitations?: string;
      attemptedAtIso: string;
    }
  | { kind: "error"; message: string };

export function BriefExecutiveSummaryCompare({
  deterministicBody,
  alternateWording,
  briefAiSynthesisEnabled,
  polishPreview,
}: {
  deterministicBody: string;
  alternateWording: NormalizedAlternateWording;
  briefAiSynthesisEnabled: boolean;
  polishPreview?: { issueId: string; briefVersionId: string; hasExistingAlternate: boolean } | null;
}) {
  const router = useRouter();
  const [variant, setVariant] = useState<CompareVariant>("original");
  const [polishState, setPolishState] = useState<PolishPreviewState>({ kind: "idle" });
  const [savePolishLoading, setSavePolishLoading] = useState(false);
  const [savePolishError, setSavePolishError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!savedFlash) return;
    const id = window.setTimeout(() => setSavedFlash(false), 6000);
    return () => window.clearTimeout(id);
  }, [savedFlash]);

  const alternateBody = alternateWording?.status === "succeeded" ? alternateWording.aiAlternateBody.trim() : "";
  const canCompare =
    briefAiSynthesisEnabled && alternateWording?.status === "succeeded" && alternateBody.length > 0;

  const visibleBody = canCompare && variant === "alternate" ? alternateBody : deterministicBody;

  const polishSection =
    polishPreview && briefAiSynthesisEnabled ? (
      <div className="space-y-3 border-t border-[--metis-outline-subtle] pt-3">
        {savedFlash ? (
          <p className="text-[0.8rem] font-medium leading-relaxed text-[--metis-status-success-fg]">
            Saved as alternate draft · shown under “Alternate draft”.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-[0.8rem]"
            disabled={polishState.kind === "loading" || savePolishLoading}
            onClick={async () => {
              setPolishState({ kind: "loading" });
              setSavePolishError(null);
              try {
                const res = await fetch(`/api/issues/${polishPreview.issueId}/brief/polish-preview`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    mode: "executive",
                    scope: "executive-summary",
                    briefVersionId: polishPreview.briefVersionId,
                  }),
                });
                const data = (await res.json()) as Record<string, unknown>;
                if (data && typeof data === "object" && data.disabled === true && typeof data.message === "string") {
                  setPolishState({ kind: "disabled", message: data.message });
                  return;
                }
                if (data && typeof data === "object" && data.success === true && typeof data.polished === "string") {
                  setPolishState({
                    kind: "ready",
                    text: data.polished,
                    limitations: typeof data.limitations === "string" ? data.limitations : undefined,
                    attemptedAtIso: typeof data.attemptedAtIso === "string" ? data.attemptedAtIso : new Date().toISOString(),
                  });
                  return;
                }
                const msg =
                  typeof data.message === "string"
                    ? data.message
                    : res.ok
                      ? "Polish preview could not be produced."
                      : `Polish preview failed (${res.status}).`;
                setPolishState({ kind: "error", message: msg });
              } catch {
                setPolishState({ kind: "error", message: "Network error while requesting polish preview." });
              }
            }}
          >
            {polishState.kind === "loading" ? "Generating preview…" : "Preview polished wording"}
          </Button>
        </div>

        {polishState.kind === "disabled" ? (
          <p className="text-[0.8rem] leading-relaxed text-[--metis-text-tertiary]">{polishState.message}</p>
        ) : null}

        {polishState.kind === "error" ? (
          <p className="text-[0.8rem] leading-relaxed text-[--metis-status-danger-fg]">{polishState.message}</p>
        ) : null}

        {polishState.kind === "ready" ? (
          <div className="space-y-2 rounded-[var(--metis-control-radius-md)] border border-[--metis-outline-subtle] bg-[--metis-surface-card] p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[--metis-text-tertiary]">
                Polished preview
              </span>
              <Badge className="text-[0.65rem] font-normal">Preview only · Not saved</Badge>
            </div>
            <p className="text-[0.72rem] leading-snug text-[--metis-text-tertiary]">
              Polished wording improves clarity and flow but does not change the underlying record. Review before circulation.
            </p>
            <p className="text-[0.72rem] leading-snug text-[--metis-text-tertiary]">
              Saved polished wording becomes the alternate draft for this brief version. It does not change the structured brief.
              {polishPreview.hasExistingAlternate ? (
                <span className="text-[--metis-text-secondary]"> This replaces the saved alternate draft for this section.</span>
              ) : null}
            </p>
            <AiProvenance
              mode="ai"
              variant="enhanced-draft"
              helper="Draft wording only — same factual basis as stored wording; not more accurate than the issue record."
            />
            {polishState.limitations?.trim() ? (
              <p className="text-[0.72rem] leading-snug text-[--metis-text-tertiary]">{polishState.limitations.trim()}</p>
            ) : null}
            <p className="max-w-4xl whitespace-pre-line text-[0.85rem] leading-7 text-[--metis-text-secondary]">{polishState.text}</p>
            <p className="text-[0.68rem] leading-snug text-[--metis-text-tertiary]">
              If the issue record changes materially, regenerate the brief or re-polish before circulation.
            </p>
            {savePolishError ? (
              <p className="text-[0.8rem] leading-relaxed text-[--metis-status-danger-fg]">{savePolishError}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[0.8rem]"
                disabled={savePolishLoading}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(polishState.text);
                  } catch {
                    /* ignore */
                  }
                }}
              >
                Copy preview
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[0.8rem]"
                disabled={savePolishLoading}
                onClick={async () => {
                  setSavePolishError(null);
                  setSavePolishLoading(true);
                  try {
                    const res = await fetch(`/api/issues/${polishPreview.issueId}/brief/polish-save`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        mode: "executive",
                        scope: "executive-summary",
                        briefVersionId: polishPreview.briefVersionId,
                        polishedBody: polishState.text,
                        attemptedAtIso: polishState.attemptedAtIso,
                        limitations: polishState.limitations ?? undefined,
                      }),
                    });
                    const data = (await res.json()) as { success?: boolean; message?: string };
                    if (!res.ok || data.success !== true) {
                      setSavePolishError(typeof data.message === "string" ? data.message : `Save failed (${res.status}).`);
                      return;
                    }
                    setPolishState({ kind: "idle" });
                    setVariant("alternate");
                    setSavedFlash(true);
                    router.refresh();
                  } catch {
                    setSavePolishError("Network error while saving polished wording.");
                  } finally {
                    setSavePolishLoading(false);
                  }
                }}
              >
                {savePolishLoading ? "Saving…" : "Save polished wording"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[0.8rem]"
                disabled={savePolishLoading}
                onClick={() => {
                  setSavePolishError(null);
                  setPolishState({ kind: "idle" });
                }}
              >
                Discard preview
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    ) : polishPreview && !briefAiSynthesisEnabled ? (
      <div className="border-t border-[--metis-outline-subtle] pt-3">
        <p className="text-[0.8rem] leading-relaxed text-[--metis-text-tertiary]">
          Polish preview is unavailable because AI synthesis is disabled.
        </p>
      </div>
    ) : null;

  const inner = (
    <>
      {canCompare ? (
        <>
          <SegmentedControl<CompareVariant>
            label="Wording comparison"
            value={variant}
            options={[
              { id: "original", label: "Stored wording" },
              { id: "alternate", label: "Alternate draft" },
            ]}
            onChange={setVariant}
          />
          {variant === "original" ? (
            <AiProvenance mode="original" />
          ) : (
            <AiProvenance
              mode="ai"
              variant="enhanced-draft"
              helper="Alternate wording only; same facts and uncertainty as the original. Not more accurate."
            />
          )}
        </>
      ) : null}

      {briefAiSynthesisEnabled && !canCompare ? (
        <p className="text-[0.8rem] leading-relaxed text-[--metis-text-tertiary]">
          {alternateWording?.status === "failed"
            ? "Alternate executive summary wording could not be produced for this version. Regenerate the brief to try again, or check synthesis configuration."
            : "No separate alternate wording is stored for this version. Regenerate the full brief to capture an optional alternate executive summary when synthesis succeeds."}
        </p>
      ) : null}

      <p className="max-w-4xl whitespace-pre-line leading-7 text-[--metis-text-secondary]">{visibleBody}</p>

      {polishSection}
    </>
  );

  if (!briefAiSynthesisEnabled) {
    return <div className="space-y-3">{inner}</div>;
  }

  return (
    <div className="space-y-3 rounded-[var(--metis-control-radius-md)] border border-dashed border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-3 py-3 sm:px-4">
      <p className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">
        Optional · Compare alternate wording
      </p>
      <p className="text-[0.75rem] leading-snug text-[--metis-text-tertiary]">
        Same stored brief and facts as below — optional drafting comparison only, not a separate source of truth or export snapshot.
      </p>
      {inner}
    </div>
  );
}
