"use client";

import { useState } from "react";

import { AiProvenance } from "@/components/ui/ai-provenance";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { NormalizedAlternateWording } from "@/lib/brief/alternateWording";

type CompareVariant = "original" | "alternate";

export function BriefExecutiveSummaryCompare({
  deterministicBody,
  alternateWording,
  briefAiSynthesisEnabled,
}: {
  deterministicBody: string;
  alternateWording: NormalizedAlternateWording;
  briefAiSynthesisEnabled: boolean;
}) {
  const [variant, setVariant] = useState<CompareVariant>("original");

  const alternateBody = alternateWording?.status === "succeeded" ? alternateWording.aiAlternateBody.trim() : "";
  const canCompare =
    briefAiSynthesisEnabled && alternateWording?.status === "succeeded" && alternateBody.length > 0;

  const visibleBody = canCompare && variant === "alternate" ? alternateBody : deterministicBody;

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
    </>
  );

  if (!briefAiSynthesisEnabled) {
    return <div className="space-y-3">{inner}</div>;
  }

  return (
    <div className="space-y-3 rounded-[var(--metis-control-radius-md)] border border-dashed border-[--metis-outline-subtle] bg-[rgba(255,255,255,0.015)] px-3 py-3 sm:px-4">
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
