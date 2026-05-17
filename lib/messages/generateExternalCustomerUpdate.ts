import type { Claim, Gap, Issue, IssueStakeholder, Source, StakeholderGroup } from "@prisma/client";

import type { MessageVariantArtifact, MessageVariantSection } from "@metis/shared/messageVariant";
import { groupClaimsForSynthesis } from "@/lib/claims/claimsForGeneration";
import { rankOpenGapsForIssue } from "@/lib/evidence/rankEvidence";

import {
  buildConsultationExternalMiddleParagraph,
  buildMessageRecordGrounding,
  consultationExternalProfile,
  formatConfirmedForExternalCopy,
  formatDoNotSayBlock,
  formatMustAvoidLine,
  recordHasCoreConsultationSafeFacts,
  collectDedupedConfirmedFactLines,
  lineSignalsEarlyClosureCorrection,
  resolveMessageAudienceProfile,
} from "./messageRecordGrounding";

/** Setup-only audience (issue.audience); no StakeholderGroup. */
export type SetupAudienceInput = { kind: "setup" };

/** Organisation group + optional per-issue IssueStakeholder enrichment. */
export type GroupAudienceInput = {
  kind: "group";
  group: StakeholderGroup;
  issueLens: IssueStakeholder | null;
};

export type ExternalAudienceInput = SetupAudienceInput | GroupAudienceInput;

export type ExternalMessageGenerationInput = {
  issue: Issue;
  sources: Source[];
  gaps: Gap[];
  claims?: Claim[];
  audience: ExternalAudienceInput;
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

function formatUncertaintyLine(g: Gap) {
  const q = cleanText(g.prompt) || cleanText(g.title);
  if (!q) return "";
  const topic = cleanText(g.linkedSection);
  const base = q.replace(/\s+/g, " ").trim();
  if (!base) return "";
  if (topic) {
    return `We are still working to confirm details related to ${topic}: ${base.endsWith("?") ? base : `${base}.`}`;
  }
  return base.endsWith("?") ? `We are still working to answer: ${base}` : `We are still working to answer: ${base}.`;
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

export function buildAudienceSnapshot(issue: Issue, audience: ExternalAudienceInput): Record<string, unknown> {
  if (audience.kind === "setup") {
    return {
      lensSource: "setup_audience_note",
      stakeholderGroupId: null,
      issueStakeholderId: null,
      issueAudienceLabel: cleanText(issue.audience) || null,
    };
  }
  const g = audience.group;
  const row = audience.issueLens;
  return {
    lensSource: "stakeholder_group",
    stakeholderGroupId: g.id,
    stakeholderGroupName: g.name,
    issueStakeholderId: row?.id ?? null,
    issueSpecificLensApplied: row ? issueLensHasContent(row) : false,
    priority: row?.priority ?? null,
    needsToKnow: row ? cleanText(row.needsToKnow) || null : null,
    issueRisk: row ? cleanText(row.issueRisk) || null : null,
    channelGuidance: row ? cleanText(row.channelGuidance) || null : null,
    toneAdjustment: row ? cleanText(row.toneAdjustment) || null : null,
    notes: row ? cleanText(row.notes) || null : null,
    defaultSensitivity: cleanText(g.defaultSensitivity) || null,
    defaultChannels: cleanText(g.defaultChannels) || null,
    defaultToneGuidance: cleanText(g.defaultToneGuidance) || null,
  };
}

function buildConsultationExternalSections(
  issue: Issue,
  profile: "service_users" | "councillors",
  grounding: ReturnType<typeof buildMessageRecordGrounding>,
  needsToKnow: string,
): MessageVariantSection[] {
  const intakeConfirmed = cleanText(issue.confirmedFacts ?? "");
  const confirmedFactLines = collectDedupedConfirmedFactLines(grounding.confirmedLines, intakeConfirmed);
  const middle = buildConsultationExternalMiddleParagraph(profile, grounding.confirmedLines, intakeConfirmed);
  const useCoreTemplate = recordHasCoreConsultationSafeFacts(confirmedFactLines);

  const draftMessage =
    profile === "service_users"
      ? [
          "We are reviewing options for service opening hours. No final decision has been made.",
          "",
          middle,
          "",
          useCoreTemplate || confirmedFactLines.some((l) => lineSignalsEarlyClosureCorrection(l))
            ? "Some local posts have suggested that early closure is already happening. That is not accurate based on the current record."
            : null,
          "",
          "We will share confirmed consultation details through official channels once the proposed options and timetable are approved.",
        ]
          .filter((p) => p !== null && String(p).trim())
          .join("\n")
      : [
          "The organisation is reviewing options for service opening hours, but no final decision has been made.",
          "",
          middle,
          "",
          "We cannot yet confirm the precise hours option, the consultation timetable, savings impact or equality impact. Those points remain subject to approval and assessment.",
          "",
          "If asked whether this is a service cut, the safest line is that the organisation is consulting on options and has not reached a final decision.",
        ].join("\n");

  const reviewLines = [
    grounding.circulationCaveat,
    grounding.equalityCaveat,
    needsToKnow ? `Audience focus on record: ${needsToKnow}` : null,
    "",
    formatDoNotSayBlock(grounding.doNotSay),
  ].filter(Boolean);

  return [
    { id: "draft-message", title: "Draft message", body: draftMessage.trim() },
    { id: "review-caveats", title: "Review before circulation", body: reviewLines.join("\n") },
  ];
}

export function generateExternalCustomerResidentStudentArtifact(input: ExternalMessageGenerationInput): MessageVariantArtifact {
  const { issue, sources, gaps, claims = [], audience } = input;
  const grounding = buildMessageRecordGrounding(issue, claims, gaps);
  const open = rankOpenGapsForIssue(gaps, { onlyOpen: true });
  const topOpen = open.slice(0, 3);

  const isSetup = audience.kind === "setup";
  const group = audience.kind === "group" ? audience.group : null;
  const issueLens = audience.kind === "group" ? audience.issueLens : null;
  const issueSpecificLensApplied = Boolean(group && issueLens && issueLensHasContent(issueLens));

  const audienceLabel = isSetup
    ? cleanText(issue.audience) || "Affected audience"
    : (group?.name ?? "").trim() || "Audience";

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

  const needsToKnowEffective = issueLens ? cleanText(issueLens.needsToKnow) : "";
  const channelEffective = issueLens ? cleanText(issueLens.channelGuidance) : "";
  const channelFromDefaults = group ? cleanText(group.defaultChannels) : "";
  const toneFromIssue = issueLens ? cleanText(issueLens.toneAdjustment) : "";
  const toneFromGroup = group ? cleanText(group.defaultToneGuidance) : "";

  const profile = resolveMessageAudienceProfile(audienceLabel, "external_customer_resident_student");

  const sections: MessageVariantSection[] = (() => {
    if (grounding.consultationIssue) {
      return buildConsultationExternalSections(
        issue,
        consultationExternalProfile(profile),
        grounding,
        needsToKnowEffective,
      );
    }

    const confirmedCopy = formatConfirmedForExternalCopy(
      grounding.confirmedLines,
      cleanText(issue.confirmedFacts ?? ""),
    );

    const whatIsHappening = (() => {
      if (confirmedCopy) return confirmedCopy;
      const title = cleanText(issue.title);
      if (title) {
        return `${title}. Confirmed details are still being recorded; we will share more when we can do so accurately.`;
      }
      return "We are preparing a factual update. Confirmed details are still being recorded; we will post more when we can do so accurately.";
    })();

    const whatWeAreDoing = (() => {
      const status = cleanText(issue.status);
      const posture = cleanText(issue.operatorPosture);
      const parts: string[] = [];
      if (status || posture) {
        parts.push(
          `Our team is actively working on this matter${status ? ` (current status: ${status})` : ""}${posture ? `. Posture: ${posture}.` : ""}`,
        );
      } else {
        parts.push("Our team is actively working on this matter and will share updates when we have confirmed information.");
      }
      if (sources.length > 0) {
        parts.push("This update reflects only what is confirmed on the issue record — not internal reference material.");
      }
      if (needsToKnowEffective) parts.push(`For this audience: ${needsToKnowEffective}`);
      return parts.join("\n\n");
    })();

    const whatYouCanDo = (() => {
      if (channelEffective) {
        return `${channelEffective}\n\nIf you need help, use the contact channels your organisation has published for this issue.`;
      }
      if (channelFromDefaults) {
        return `${channelFromDefaults}\n\nIf you need help, use the contact channels your organisation has published for this issue.`;
      }
      return "Use the contact channels your organisation has published for this type of issue.";
    })();

    const whatWeCantConfirm = (() => {
      if (!topOpen.length) {
        return formatDoNotSayBlock(grounding.doNotSay, 8) || "No open clarification items require a public caveat at this time.";
      }
      const lines = topOpen.map(formatUncertaintyLine).filter(Boolean);
      return (
        "Some details are still being confirmed:\n\n" +
        lines.map((l) => `- ${l}`).join("\n") +
        (open.length > topOpen.length ? "\n\nAdditional items remain under internal review." : "") +
        `\n\n${formatDoNotSayBlock(grounding.doNotSay, 5)}`
      );
    })();

    return [
      { id: "draft-message", title: "Draft message", body: whatIsHappening },
      { id: "what-we-are-doing", title: "What we are doing", body: whatWeAreDoing },
      { id: "what-you-can-do", title: "What you can do", body: whatYouCanDo },
      { id: "what-we-cant-confirm-yet", title: "What we cannot confirm yet", body: whatWeCantConfirm },
      {
        id: "next-update",
        title: "Next update",
        body: "We will post an update when we have new confirmed information. Please rely on official channels rather than informal summaries.",
      },
    ];
  })();

  const mustAvoid: string[] = [
    ...grounding.doNotSay.map(formatMustAvoidLine),
    "Do not quote or paraphrase internal observations in external channels.",
    "Do not share internal source identifiers publicly.",
    "Do not speculate beyond confirmed facts and this draft.",
    "Treat as draft for review — not approved for circulation.",
  ];
  if (issueLens) {
    const risk = cleanText(issueLens.issueRisk);
    if (risk) mustAvoid.push(`Audience risk (internal): ${risk}`);
  }
  const grouped = groupClaimsForSynthesis(claims);
  if (grouped.assumptions.length) {
    mustAvoid.push("Phrase assumptions conditionally — they are not verified fact.");
  }
  if (grouped.needsValidation.length) {
    mustAvoid.push("Do not present needs-validation claims as settled fact.");
  }

  const toneParts: string[] = [];
  if (toneFromIssue) toneParts.push(toneFromIssue);
  if (toneFromGroup) toneParts.push(toneFromGroup);
  const toneNotes =
    toneParts.length > 0
      ? toneParts.join(" ")
      : grounding.consultationIssue
        ? "Plain, calm language. Reassure on process integrity; avoid implying a decision is already made."
        : "Calm, factual tone. Avoid blame, jargon, and commitments where details remain open.";

  return {
    templateId: "external_customer_resident_student",
    metadata: {
      publicHeadline: cleanText(issue.title) || "Service update",
      lastRevisionLabel: nowLabel(),
      openGapsLabel: `${open.length} open question(s) on the issue list`,
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

export function renderMessageVariantMarkdown(title: string, artifact: MessageVariantArtifact) {
  const lines: string[] = [`# ${artifact.metadata.publicHeadline || title}`, ""];
  lines.push(`*Audience: ${artifact.metadata.audienceLabel} · ${artifact.metadata.lastRevisionLabel}*`);
  lines.push(
    "",
    "**DRAFT FOR REVIEW — NOT APPROVED FOR CIRCULATION.** Check for sensitive, legal, personal, security, or unverified claims before use.",
  );
  if (artifact.metadata.issueLevelAudienceNote) {
    lines.push("", `*${artifact.metadata.issueLevelAudienceNote}*`);
  }
  if (artifact.metadata.lensEnrichmentNote) {
    lines.push("", `*${artifact.metadata.lensEnrichmentNote}*`);
  }
  lines.push("");
  for (const s of artifact.sections) {
    lines.push(`## ${s.title}`, "", s.body.trim(), "");
  }
  lines.push("## Guardrails (internal)", "", "**Tone:**", artifact.guardrails.toneNotes, "", "**Avoid:**");
  for (const m of artifact.guardrails.mustAvoid) {
    lines.push(`- ${m}`);
  }
  lines.push("");
  return lines.join("\n").trim() + "\n";
}
