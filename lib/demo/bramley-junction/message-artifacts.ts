import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";
import type { MessageVariantTemplateId } from "@metis/shared/messageVariant";

export function buildBramleyMessageArtifact(params: {
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
  const commonMetadata = {
    publicHeadline: params.publicHeadline ?? "Bramley Junction",
    lastRevisionLabel: params.lastRevisionLabel ?? "Demo",
    openGapsLabel: params.openGapsLabel ?? "See issue record",
    audienceLabel: params.audienceLabel ?? params.sectionTitle,
    lensSource: "issue_audience_only" as const,
    issueLevelAudienceNote: null,
    aiWordingPolish: "deterministic_only" as const,
    aiComparisonAvailable: false,
  };
  const base = {
    templateId: params.templateId,
    metadata: { ...commonMetadata },
    sections: [{ id: "primary", title: params.sectionTitle, body: params.body }],
    guardrails: {
      mustAvoid: params.mustAvoid,
      toneNotes: params.toneNotes ?? "Fictional UK rail demo — keep claims aligned to issue record sources.",
    },
  };
  return MessageVariantArtifactSchema.parse(base);
}
