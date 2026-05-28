import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";
import type { MessageVariantTemplateId } from "@metis/shared/messageVariant";

export function buildNorthbankMessageArtifact(params: {
  templateId: MessageVariantTemplateId;
  sectionTitle: string;
  body: string;
  mustAvoid: string[];
  publicHeadline?: string;
  lastRevisionLabel?: string;
  openGapsLabel?: string;
  audienceLabel?: string;
  toneNotes?: string;
}) {
  return MessageVariantArtifactSchema.parse({
    templateId: params.templateId,
    metadata: {
      publicHeadline: params.publicHeadline ?? "Northbank Green Saver",
      lastRevisionLabel: params.lastRevisionLabel ?? "Demo",
      openGapsLabel: params.openGapsLabel ?? "See issue record",
      audienceLabel: params.audienceLabel ?? params.sectionTitle,
      lensSource: "issue_audience_only" as const,
      issueLevelAudienceNote: null,
      aiWordingPolish: "deterministic_only" as const,
      aiComparisonAvailable: false,
    },
    sections: [{ id: "primary", title: params.sectionTitle, body: params.body }],
    guardrails: {
      mustAvoid: params.mustAvoid,
      toneNotes: params.toneNotes ?? "Fictional building society demo — regulated launch readiness only; not campaign copy.",
    },
  });
}
