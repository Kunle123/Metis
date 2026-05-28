import type { BriefArtifact } from "@metis/shared/briefVersion";
import { BriefArtifactSchema } from "@metis/shared/briefVersion";
import type { MessageVariantArtifact, MessageVariantSection } from "@metis/shared/messageVariant";
import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";

import type { IssueHistoryGuardrails, IssueHistoryMessageWording } from "./issueHistoryTypes";

function normalizeBody(text: string): string {
  return text.replaceAll("\\n", "\n");
}

const PRIMARY_SECTION_IDS = new Set(["draft-message", "holding-line", "what-is-happening"]);

function splitMessageSectionsForDisplay(sections: MessageVariantSection[]): {
  primary: MessageVariantSection | null;
  supporting: MessageVariantSection[];
} {
  const primary = sections.find((s) => PRIMARY_SECTION_IDS.has(s.id)) ?? sections[0] ?? null;
  const supporting = sections.filter((s) => s !== primary);
  return { primary, supporting };
}

function normalizeMessageBodyForDiff(text: string): string {
  return String(text ?? "")
    .replaceAll("\\n", "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function getMessageWordingCompare(artifact: MessageVariantArtifact): IssueHistoryMessageWording | undefined {
  const { primary } = splitMessageSectionsForDisplay(artifact.sections);
  if (!primary) return undefined;

  const det = artifact.metadata.deterministicSectionBodiesById;
  const canCompare = Boolean(artifact.metadata.aiComparisonAvailable && det && typeof det === "object");
  const storedFromSnapshot = det?.[primary.id];
  const storedPrimaryBody =
    typeof storedFromSnapshot === "string" && storedFromSnapshot.trim() ? storedFromSnapshot : primary.body;

  if (canCompare && storedFromSnapshot) {
    const polishedPrimaryBody = primary.body;
    if (normalizeMessageBodyForDiff(storedPrimaryBody) === normalizeMessageBodyForDiff(polishedPrimaryBody)) {
      return undefined;
    }
    return {
      draftBody: normalizeBody(storedPrimaryBody),
      aiPolishedBody: normalizeBody(polishedPrimaryBody),
      defaultMode: "ai_polished",
    };
  }

  return undefined;
}

export function briefArtifactToRecordSections(artifact: BriefArtifact): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [];

  if (artifact.lede.trim()) {
    sections.push({ heading: "Position", body: normalizeBody(artifact.lede.trim()) });
  }

  for (const block of artifact.executive.blocks) {
    if (block.body.trim()) {
      sections.push({ heading: block.label.trim() || "Executive block", body: normalizeBody(block.body.trim()) });
    }
  }

  if (artifact.executive.immediateActions.length) {
    sections.push({
      heading: "Immediate actions",
      body: artifact.executive.immediateActions.map((a) => `- ${a}`).join("\n"),
    });
  }

  for (const section of artifact.full.sections) {
    if (section.body.trim()) {
      sections.push({ heading: section.title, body: normalizeBody(section.body.trim()) });
    }
  }

  return sections;
}

export function parseBriefArtifact(raw: unknown): BriefArtifact | null {
  const parsed = BriefArtifactSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function parseMessageArtifact(raw: unknown): MessageVariantArtifact | null {
  const parsed = MessageVariantArtifactSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function messageArtifactPrimaryBody(artifact: MessageVariantArtifact): string {
  const { primary } = splitMessageSectionsForDisplay(artifact.sections);
  return primary ? normalizeBody(primary.body) : "";
}

export function messageArtifactWording(
  artifact: MessageVariantArtifact,
): IssueHistoryMessageWording | undefined {
  return getMessageWordingCompare(artifact);
}

export function messageArtifactGuardrails(artifact: MessageVariantArtifact): IssueHistoryGuardrails | undefined {
  const mustAvoid = artifact.guardrails.mustAvoid.filter(Boolean);
  if (!mustAvoid.length && !artifact.guardrails.toneNotes.trim()) return undefined;
  return {
    mustAvoid,
    toneNotes: artifact.guardrails.toneNotes.trim() || undefined,
  };
}

export function messageArtifactRecordSections(artifact: MessageVariantArtifact): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [];
  const { primary, supporting } = splitMessageSectionsForDisplay(artifact.sections);

  if (primary?.body.trim()) {
    sections.push({ heading: primary.title || "Message body", body: normalizeBody(primary.body) });
  }

  for (const section of supporting) {
    if (section.body.trim()) {
      sections.push({ heading: section.title, body: normalizeBody(section.body) });
    }
  }

  const guardrails = messageArtifactGuardrails(artifact);
  if (guardrails?.mustAvoid.length) {
    sections.push({
      heading: "Do not say",
      body: guardrails.mustAvoid.map((line) => `- ${line}`).join("\n"),
    });
  }

  return sections;
}
