import type { Claim, Gap, Issue, IssueStakeholder, StakeholderGroup } from "@prisma/client";

import type { MediaHoldingLineArtifact, MessageVariantSection } from "@metis/shared/messageVariant";
import { rankOpenGapsForIssue } from "@/lib/evidence/rankEvidence";

import {
  buildMessageRecordGrounding,
  formatConfirmedForExternalCopy,
  formatDoNotSayBlock,
  formatMustAvoidLine,
  issueSignalsConsultationHours,
} from "./messageRecordGrounding";

/** Setup-only audience (issue.audience); no StakeholderGroup. */
export type SetupAudienceInput = { kind: "setup" };

/** Organisation group + optional per-issue IssueStakeholder enrichment. */
export type GroupAudienceInput = {
  kind: "group";
  group: StakeholderGroup;
  issueLens: IssueStakeholder | null;
};

export type AudienceInput = SetupAudienceInput | GroupAudienceInput;

export type MediaHoldingLineGenerationInput = {
  issue: Issue;
  gaps: Gap[];
  claims?: Claim[];
  audience: AudienceInput;
};

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function nowLabel() {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm} (generated)`;
}

function issueLensHasContent(row: IssueStakeholder) {
  return Boolean(
    cleanText(row.needsToKnow) ||
      cleanText(row.issueRisk) ||
      cleanText(row.channelGuidance) ||
      cleanText(row.toneAdjustment) ||
      cleanText(row.notes),
  );
}

export function generateMediaHoldingLineArtifact(input: MediaHoldingLineGenerationInput): MediaHoldingLineArtifact {
  const { issue, gaps, claims = [], audience } = input;
  const grounding = buildMessageRecordGrounding(issue, claims, gaps);
  const open = rankOpenGapsForIssue(gaps, { onlyOpen: true });

  const isSetup = audience.kind === "setup";
  const group = audience.kind === "group" ? audience.group : null;
  const issueLens = audience.kind === "group" ? audience.issueLens : null;
  const issueSpecificLensApplied = Boolean(group && issueLens && issueLensHasContent(issueLens));

  const audienceLabel = isSetup
    ? cleanText(issue.audience) || "Media"
    : (group?.name ?? "").trim() || "Media";

  const lensSource = isSetup ? ("issue_audience_only" as const) : ("stakeholder_group" as const);

  const issueLevelAudienceNote = isSetup
    ? "Using intake audience note only. Select an organisation audience group in Messages to apply defaults from Settings → Audience groups."
    : null;

  const lensEnrichmentNote = (() => {
    if (isSetup || !group) return null;
    if (!issueLens || !issueLensHasContent(issueLens)) {
      return "Using organisation audience defaults for this group from Settings → Audience groups.";
    }
    return null;
  })();

  const confirmedCopy = formatConfirmedForExternalCopy(
    grounding.confirmedLines,
    cleanText(issue.confirmedFacts ?? ""),
  );

  const sections: MessageVariantSection[] = (() => {
    if (grounding.consultationIssue || issueSignalsConsultationHours(issue)) {
      const holdingLine = [
        "We are reviewing options for service opening hours. No final decision has been made.",
        "",
        "We will share updates through official channels when there is confirmed information.",
      ].join("\n");

      const ifPressed = [
        "If asked whether this is a service cut:",
        grounding.serviceCutHoldingLine,
        "",
        "If asked for exact hours or equality impact:",
        "These are under consultation and assessment — we cannot confirm outcomes yet.",
      ].join("\n");

      return [
        { id: "draft-message", title: "Holding line", body: holdingLine },
        {
          id: "what-we-can-confirm",
          title: "What we can confirm",
          body: confirmedCopy || "Consultation is under way; no final decision has been made.",
        },
        { id: "if-pressed", title: "If pressed", body: ifPressed },
        { id: "review-caveats", title: "Do not say", body: formatDoNotSayBlock(grounding.doNotSay, 6) },
      ];
    }

    const holdingLine = confirmedCopy
      ? "We are aware of the matter and are providing updates as information is confirmed.\n\nWe will share more through official channels."
      : "We are aware of the matter and are investigating. We will share confirmed information when available.";

    return [
      { id: "draft-message", title: "Holding line", body: holdingLine },
      {
        id: "what-we-can-confirm",
        title: "What we can confirm",
        body: confirmedCopy || "No confirmed facts are recorded yet.",
      },
      {
        id: "under-review",
        title: "What is under review",
        body:
          open.length > 0
            ? "Operational details are still being confirmed internally."
            : "No open review items are recorded on the issue list.",
      },
      {
        id: "if-pressed",
        title: "If pressed",
        body: "We are actively reviewing the record and will update when details are confirmed. We are prioritising accurate information over speculation.",
      },
    ];
  })();

  const mustAvoid: string[] = [
    ...grounding.doNotSay.map(formatMustAvoidLine),
    "Do not quote internal observations or source codes.",
    "Do not speculate beyond confirmed facts in this draft.",
    "Treat as draft for review — not approved for circulation.",
  ];

  const toneNotes =
    "Short, calm press-office style. Prefer confirmed facts. Use the service-cut holding line when challenged. Avoid hours, savings, and impact claims until confirmed.";

  return {
    templateId: "media_holding_line",
    metadata: {
      publicHeadline: cleanText(issue.title) || "Media holding line",
      lastRevisionLabel: nowLabel(),
      openGapsLabel: `${open.length} open question(s) under review`,
      audienceLabel,
      lensSource,
      issueLevelAudienceNote,
      stakeholderGroupId: group?.id ?? null,
      issueSpecificLensApplied,
      lensEnrichmentNote,
    },
    sections,
    guardrails: {
      mustAvoid: [...new Set(mustAvoid)],
      toneNotes,
    },
  };
}

export function renderMediaHoldingLineMarkdown(title: string, artifact: MediaHoldingLineArtifact) {
  const lines: string[] = [`# ${artifact.metadata.publicHeadline || title}`, ""];
  lines.push(`*Audience: ${artifact.metadata.audienceLabel} · ${artifact.metadata.lastRevisionLabel}*`);
  lines.push(
    "",
    "**DRAFT FOR REVIEW — NOT APPROVED FOR CIRCULATION.** Check for sensitive, legal, personal, security, or unverified claims before use.",
  );
  if (artifact.metadata.issueLevelAudienceNote) lines.push("", `*${artifact.metadata.issueLevelAudienceNote}*`);
  if (artifact.metadata.lensEnrichmentNote) lines.push("", `*${artifact.metadata.lensEnrichmentNote}*`);
  lines.push("");
  for (const s of artifact.sections) {
    lines.push(`## ${s.title}`, "", s.body.trim(), "");
  }
  lines.push("## Guardrails (internal)", "", "**Tone:**", artifact.guardrails.toneNotes, "", "**Avoid:**");
  for (const m of artifact.guardrails.mustAvoid) lines.push(`- ${m}`);
  lines.push("");
  return lines.join("\n").trim() + "\n";
}
