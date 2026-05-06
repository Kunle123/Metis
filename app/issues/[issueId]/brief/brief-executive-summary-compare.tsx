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

  return (
    <div className="space-y-3">
      {canCompare ? (
        <>
          <SegmentedControl<CompareVariant>
            label="Executive summary wording"
            value={variant}
            options={[
              { id: "original", label: "Original" },
              { id: "alternate", label: "Alternate wording" },
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
    </div>
  );
}
