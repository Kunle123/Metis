"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AiProvenance } from "@/components/ui/ai-provenance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { NormalizedAlternateWording } from "@/lib/brief/alternateWording";
import { cn } from "@/lib/utils";

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
  layout = "default",
}: {
  deterministicBody: string;
  alternateWording: NormalizedAlternateWording;
  briefAiSynthesisEnabled: boolean;
  polishPreview?: { issueId: string; briefVersionId: string; hasExistingAlternate: boolean } | null;
  /** Executive brief: stored wording is primary; comparison is collapsed below. */
  layout?: "default" | "executive";
}) {
  const router = useRouter();
  const [variant, setVariant] = useState<CompareVariant>("original");
  const [polishState, setPolishState] = useState<PolishPreviewState>({ kind: "idle" });
  const [savePolishLoading, setSavePolishLoading] = useState(false);
  const [savePolishError, setSavePolishError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const isExecutive = layout === "executive";

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
      <div
        className={cn("space-y-3 border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] pt-3", isExecutive && "pt-2.5")}
      >
        {savedFlash ? (
          <p
            className={cn(
              "font-medium leading-relaxed text-[--metis-status-success-fg]",
              isExecutive ? "text-[0.72rem]" : "text-[0.8rem]",
            )}
          >
            Saved as alternate draft · shown under “Alternate draft”.
          </p>
        ) : null}

        <div className="space-y-2">
          {polishPreview.hasExistingAlternate && polishState.kind !== "ready" ? (
            <p className="max-w-xl text-[0.68rem] leading-snug text-[--metis-text-tertiary]">
              Saving a polished preview will replace the saved alternate draft for this section.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={isExecutive ? "h-8 text-[0.72rem]" : "text-[0.8rem]"}
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
        </div>

        {polishState.kind === "disabled" ? (
          <p className="text-[0.72rem] leading-relaxed text-[--metis-text-tertiary]">{polishState.message}</p>
        ) : null}

        {polishState.kind === "error" ? (
          <p className="text-[0.72rem] leading-relaxed text-[--metis-status-danger-fg]">{polishState.message}</p>
        ) : null}

        {polishState.kind === "ready" ? (
          <div
            className={cn(
              "space-y-2 rounded-md border border-[color-mix(in_oklab,var(--metis-outline-subtle)_85%,transparent)] bg-[color-mix(in_oklab,var(--metis-paper)_30%,transparent)] p-3",
              !isExecutive && "rounded-[var(--metis-control-radius-md)] border-[--metis-outline-subtle] bg-[--metis-surface-card] sm:p-4",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.62rem] font-medium text-[--metis-text-tertiary]">Polished preview</span>
              <Badge className="text-[0.62rem] font-normal">Preview only · Not saved</Badge>
            </div>
            <p className="text-[0.68rem] leading-snug text-[--metis-text-tertiary]">
              Polished wording improves clarity and flow but does not change the underlying record. Review before circulation.
            </p>
            {polishPreview.hasExistingAlternate ? (
              <p className="text-[0.68rem] leading-snug text-[--metis-text-tertiary]">
                Save will replace the current alternate draft.
              </p>
            ) : null}
            <AiProvenance
              mode="ai"
              variant="enhanced-draft"
              helper="Draft wording only — same factual basis as stored wording; not more accurate than the issue record."
            />
            {polishState.limitations?.trim() ? (
              <p className="text-[0.68rem] leading-snug text-[--metis-text-tertiary]">{polishState.limitations.trim()}</p>
            ) : null}
            <p
              className={cn(
                "max-w-4xl whitespace-pre-line text-[--metis-text-secondary]",
                isExecutive ? "text-[0.8125rem] leading-[1.55]" : "text-[0.85rem] leading-7",
              )}
            >
              {polishState.text}
            </p>
            {savePolishError ? (
              <p className="text-[0.72rem] leading-relaxed text-[--metis-status-danger-fg]">{savePolishError}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={isExecutive ? "h-8 text-[0.72rem]" : "text-[0.8rem]"}
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
                className={isExecutive ? "h-8 text-[0.72rem]" : "text-[0.8rem]"}
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
                className={isExecutive ? "h-8 text-[0.72rem]" : "text-[0.8rem]"}
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
      <div className="border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] pt-3">
        <p className="text-[0.72rem] leading-relaxed text-[--metis-text-tertiary]">
          Polish preview is unavailable because AI synthesis is disabled.
        </p>
      </div>
    ) : null;

  const comparePanel = (
    <>
      {canCompare ? (
        <>
          <SegmentedControl<CompareVariant>
            label="Wording comparison"
            value={variant}
            options={[
              { id: "original", label: "Stored wording" },
              { id: "alternate", label: "AI-polished wording" },
            ]}
            onChange={setVariant}
          />
          {variant === "original" ? (
            isExecutive ? (
              <p className="text-[0.72rem] leading-relaxed text-[--metis-text-tertiary]">Stored wording is shown above.</p>
            ) : (
              <AiProvenance mode="original" />
            )
          ) : (
            <>
              <AiProvenance
                mode="ai"
                variant="enhanced-draft"
                helper="Alternate wording only; same facts and uncertainty as the original. Not more accurate."
              />
              <p
                className={cn(
                  "max-w-4xl whitespace-pre-line text-[--metis-text-secondary]",
                  isExecutive ? "text-[0.8125rem] leading-[1.55]" : "leading-7",
                )}
              >
                {alternateBody}
              </p>
            </>
          )}
        </>
      ) : null}

      {briefAiSynthesisEnabled && !canCompare ? (
        <p className="text-[0.72rem] leading-relaxed text-[--metis-text-tertiary]">
          {alternateWording?.status === "failed"
            ? "AI-polished wording could not be produced for this version. Refresh the brief to try again, or check synthesis configuration."
            : "No AI-polished wording is stored for this version. Refresh the brief to capture optional drafting comparisons when synthesis succeeds."}
        </p>
      ) : null}

      {!isExecutive ? <p className="max-w-4xl whitespace-pre-line leading-7 text-[--metis-text-secondary]">{visibleBody}</p> : null}

      {polishSection}
    </>
  );

  const storedBody = (
    <p
      className={cn(
        "max-w-4xl whitespace-pre-line text-[--metis-text-secondary]",
        isExecutive ? "text-[0.875rem] leading-[1.7]" : "leading-7",
      )}
    >
      {deterministicBody}
    </p>
  );

  if (isExecutive) {
    return (
      <div className="space-y-0">
        {storedBody}
        {briefAiSynthesisEnabled || canCompare || polishPreview ? (
          <details className="group mt-4 border-t border-dashed border-[color-mix(in_oklab,var(--metis-outline-subtle)_75%,transparent)] pt-3">
            <summary className="cursor-pointer list-none text-[0.78rem] font-medium text-[--metis-brass-soft] marker:content-none hover:text-[--metis-text-primary] [&::-webkit-details-marker]:hidden">
              Compare wording
            </summary>
            <p className="mt-1 text-[0.68rem] leading-snug text-[--metis-text-tertiary]">Same facts. Drafting comparison only.</p>
            <div className="mt-3 space-y-3 border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_65%,transparent)] pt-3">
              <div>
                <p className="text-[0.72rem] font-medium text-[--metis-text-secondary]">AI-polished wording</p>
                <p className="mt-1 text-[0.68rem] leading-snug text-[--metis-text-tertiary]">
                  Same facts. Drafting comparison only. The stored brief remains the source of truth.
                </p>
              </div>
              {comparePanel}
            </div>
          </details>
        ) : null}
      </div>
    );
  }

  if (!briefAiSynthesisEnabled) {
    return <div className="space-y-3">{storedBody}</div>;
  }

  return (
    <div className="space-y-3 rounded-[var(--metis-control-radius-md)] border border-dashed border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-3 py-3 sm:px-4">
      <p className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">
        Optional · Compare alternate wording
      </p>
      <p className="text-[0.75rem] leading-snug text-[--metis-text-tertiary]">
        Same stored brief and facts as below — optional drafting comparison only, not a separate source of truth or export snapshot.
      </p>
      {comparePanel}
    </div>
  );
}
