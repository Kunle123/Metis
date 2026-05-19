"use client";

import { useEffect, useState } from "react";

import { AiPolishedField } from "@/components/outputs/AiPolishedField";
import { OutputWordingModeBar } from "@/components/outputs/OutputWordingModeBar";
import { ExecutiveBriefSection } from "@/components/brief/ExecutiveBriefSection";
import type { NormalizedAlternateWording } from "@/lib/brief/alternateWording";
import type { BriefConfidence } from "@metis/shared/briefVersion";
import {
  buildPolishedFieldsFromAlternate,
  canSelectAiPolishedMode,
  isFieldShowingAiPolished,
  resolveOutputFieldText,
  shouldShowOutputWordingControl,
  type OutputWordingMode,
} from "@/lib/outputs/outputWordingMode";
import { cn } from "@/lib/utils";

type FullBriefSection = {
  id: string;
  /** Pre-resolved on the server — do not pass title formatter functions into this client component. */
  displayTitle: string;
  body: string;
  confidence: BriefConfidence;
  updatedAtLabel: string;
};

function readinessFromConfidence(confidence: BriefConfidence) {
  if (confidence === "Needs validation")
    return { label: "Needs validation", tone: "bg-[--metis-status-danger-bg] text-[--metis-status-danger-fg]" };
  if (confidence === "Unclear")
    return { label: "Needs clarification", tone: "bg-[--metis-status-warning-bg] text-[--metis-status-warning-fg]" };
  if (confidence === "Confirmed")
    return { label: "Ready to circulate", tone: "bg-[--metis-status-success-bg] text-[--metis-status-success-fg]" };
  return { label: "Ready for review", tone: "bg-[--metis-status-neutral-bg] text-[--metis-status-neutral-fg]" };
}

export function FullBriefPresentation({
  title,
  briefVersionLabel,
  briefInSync,
  sections,
  execSummaryAlternateWording,
  briefAiSynthesisEnabled,
  polishPreview,
}: {
  title: string;
  briefVersionLabel: string;
  briefInSync: boolean;
  sections: FullBriefSection[];
  execSummaryAlternateWording: NormalizedAlternateWording;
  briefAiSynthesisEnabled: boolean;
  polishPreview?: { issueId: string; briefVersionId: string } | null;
}) {
  const [wordingMode, setWordingMode] = useState<OutputWordingMode>("stored");
  const [previewPolishedBody, setPreviewPolishedBody] = useState<string | null>(null);

  const execSummarySection = sections.find((s) => s.id === "executive-summary");
  const storedExecSummaryBody = execSummarySection?.body.trim() ?? "";

  const polishedFields = buildPolishedFieldsFromAlternate({
    alternateWording: execSummaryAlternateWording,
    previewPolishedBody,
    field: "executiveSummary",
  });

  const canSelectAiPolished = canSelectAiPolishedMode(polishedFields);
  const showWordingControl = shouldShowOutputWordingControl({
    aiSynthesisEnabled: briefAiSynthesisEnabled,
    hasPolishContext: Boolean(polishPreview),
  });

  const isExecSummaryAi = isFieldShowingAiPolished({
    mode: wordingMode,
    field: "executiveSummary",
    polishedFields,
  });

  const displayExecSummaryBody = execSummarySection
    ? resolveOutputFieldText({
        mode: wordingMode,
        field: "executiveSummary",
        storedText: storedExecSummaryBody,
        polishedFields,
      })
    : "";

  useEffect(() => {
    if (wordingMode === "ai-polished" && !canSelectAiPolished) {
      setWordingMode("stored");
    }
  }, [wordingMode, canSelectAiPolished]);

  return (
    <article className="min-w-0 overflow-hidden rounded-[0.85rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_98%,var(--metis-paper))] shadow-[0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_15%,transparent)]">
      <header className="border-b border-[--metis-outline-subtle] px-5 py-4 sm:px-7 sm:py-5">
        <p className="text-[0.58rem] font-medium uppercase tracking-[0.2em] text-[--metis-brass-soft]">Full brief</p>
        <h2 className="mt-1 text-lg font-semibold leading-snug tracking-tight text-[--metis-text-primary] sm:text-[1.35rem]">
          {title}
        </h2>
        <p className="mt-2 text-[0.68rem] text-[--metis-text-tertiary]">
          {briefVersionLabel} · {briefInSync ? "Up to date" : "Needs refresh"}
        </p>
      </header>

      {showWordingControl && polishPreview ? (
        <OutputWordingModeBar
          wordingMode={wordingMode}
          onWordingModeChange={setWordingMode}
          canSelectAiPolished={canSelectAiPolished}
          polishPreview={{
            issueId: polishPreview.issueId,
            briefVersionId: polishPreview.briefVersionId,
            request: { mode: "executive", scope: "executive-summary" },
          }}
          onPreviewReady={(text) => setPreviewPolishedBody(text)}
        />
      ) : null}

      <div className="space-y-4 px-4 py-5 sm:space-y-5 sm:px-7 sm:py-6">
        {sections.map((section, index) => {
          const readiness = readinessFromConfidence(section.confidence);
          const isExecSummary = section.id === "executive-summary";
          const body = isExecSummary ? displayExecSummaryBody : section.body;

          return (
            <ExecutiveBriefSection
              key={section.id}
              eyebrow={String(index + 1).padStart(2, "0")}
              title={section.displayTitle}
              description={`${readiness.label} · Updated ${section.updatedAtLabel}`}
              variant={index === 0 ? "emphasis" : "neutral"}
              accent={index === 0 ? "brass" : "none"}
            >
              {isExecSummary ? (
                <AiPolishedField active={isExecSummaryAi} className="max-w-4xl">
                  <p
                    className={cn(
                      "whitespace-pre-line text-[0.875rem] leading-[1.7]",
                      isExecSummaryAi ? "text-[--metis-text-primary]" : "text-[--metis-text-secondary]",
                    )}
                  >
                    {body}
                  </p>
                </AiPolishedField>
              ) : (
                <p className="max-w-4xl whitespace-pre-line text-[0.875rem] leading-[1.7] text-[--metis-text-secondary]">
                  {body}
                </p>
              )}
            </ExecutiveBriefSection>
          );
        })}
      </div>
    </article>
  );
}
