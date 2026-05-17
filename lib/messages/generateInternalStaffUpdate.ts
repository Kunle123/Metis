import type { Claim, Gap, InternalInput, Issue, IssueStakeholder, Source, StakeholderGroup } from "@prisma/client";

import type { InternalStaffUpdateArtifact, MessageVariantSection } from "@metis/shared/messageVariant";
import { rankInternalInputsForIssue, rankOpenGapsForIssue, rankSourcesForIssue } from "@/lib/evidence/rankEvidence";

import {
  activeClaimsSummary,
  buildMessageRecordGrounding,
  formatDoNotSayBlock,
  issueSignalsConsultationHours,
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

export type AudienceInput = SetupAudienceInput | GroupAudienceInput;

export type InternalStaffMessageGenerationInput = {
  issue: Issue;
  sources: Source[];
  gaps: Gap[];
  internalInputs: InternalInput[];
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

function formatGapLineShort(g: Gap) {
  const q = (cleanText(g.prompt) || cleanText(g.title)).replace(/\s+/g, " ").trim();
  const sev = cleanText(g.severity);
  return sev ? `[${sev}] ${q}` : q;
}

function buildConsultationStaffSections(
  issue: Issue,
  grounding: ReturnType<typeof buildMessageRecordGrounding>,
  gaps: Gap[],
  needsToKnow: string,
  channelEffective: string,
): MessageVariantSection[] {
  const open = rankOpenGapsForIssue(gaps, { onlyOpen: true });
  const topCritical = open.filter((g) => String(g.severity ?? "").trim() === "Critical").slice(0, 2);
  const topOther = open.filter((g) => String(g.severity ?? "").trim() !== "Critical").slice(0, 2);

  const frontDesk = [
    "Use this line at the front desk and on the phone unless your manager issues approved wording:",
    "",
    "We are reviewing options for service opening hours. No final decision has been made. Consultation is under way and feedback will shape any recommendation.",
    "",
    "If asked for exact hours, savings, equality impact, or whether the service is closing early: explain that these points are not confirmed yet and you will come back once approved wording is available.",
    "",
    grounding.serviceCutHoldingLine,
  ].join("\n");

  const escalation = [
    "Approved consultation wording is not yet signed off for wider use.",
    channelEffective
      ? `Channel guidance on record: ${channelEffective}`
      : "Escalate detailed or media enquiries to communications / your incident lead — do not improvise.",
    needsToKnow ? `Staff audience note: ${needsToKnow}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const stillOpen =
    topCritical.length || topOther.length
      ? [
          "Still open on the record (internal):",
          "",
          ...topCritical.map((g) => `- ${formatGapLineShort(g)}`),
          ...topOther.map((g) => `- ${formatGapLineShort(g)}`),
          open.length > topCritical.length + topOther.length
            ? `\n(${open.length - topCritical.length - topOther.length} more — see Open questions.)`
            : "",
        ].join("\n")
      : "No open questions flagged on the tracker.";

  return [
    { id: "draft-message", title: "Front-desk line", body: frontDesk },
    { id: "do-not-say", title: "Do not say", body: formatDoNotSayBlock(grounding.doNotSay, 8) },
    { id: "escalation", title: "Escalation & sign-off", body: escalation },
    { id: "still-validating", title: "Still open internally", body: stillOpen },
    {
      id: "record-basis",
      title: "Record basis (internal)",
      body: [grounding.equalityCaveat, grounding.circulationCaveat].join("\n\n"),
    },
  ];
}

export function generateInternalStaffUpdateArtifact(input: InternalStaffMessageGenerationInput): InternalStaffUpdateArtifact {
  const { issue, sources, gaps, internalInputs, claims = [], audience } = input;
  const grounding = buildMessageRecordGrounding(issue, claims, gaps);

  const isSetup = audience.kind === "setup";
  const group = audience.kind === "group" ? audience.group : null;
  const issueLens = audience.kind === "group" ? audience.issueLens : null;
  const issueSpecificLensApplied = Boolean(group && issueLens && issueLensHasContent(issueLens));

  const audienceLabel = isSetup
    ? cleanText(issue.audience) || "Staff audience"
    : (group?.name ?? "").trim() || "Staff audience";

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

  const open = rankOpenGapsForIssue(gaps, { onlyOpen: true });
  const profile = resolveMessageAudienceProfile(audienceLabel, "internal_staff_update");

  const sections: MessageVariantSection[] = (() => {
    if (grounding.consultationIssue && profile === "staff") {
      const staffSections = buildConsultationStaffSections(
        issue,
        grounding,
        gaps,
        needsToKnowEffective,
        channelEffective || channelFromDefaults,
      );
      const basisIdx = staffSections.findIndex((s) => s.id === "record-basis");
      if (basisIdx >= 0) {
        staffSections[basisIdx] = {
          ...staffSections[basisIdx]!,
          body: [
            activeClaimsSummary(claims),
            grounding.equalityCaveat,
            grounding.circulationCaveat,
          ].join("\n\n"),
        };
      }
      return staffSections;
    }

    const summary = cleanText(issue.summary);
    const confirmed = cleanText(issue.confirmedFacts);
    const posture = cleanText(issue.operatorPosture);
    const status = cleanText(issue.status);

    const rankedNonExcludedInputs = rankInternalInputsForIssue(internalInputs, { excludeFromBrief: true });
    const topInputs = rankedNonExcludedInputs.slice(0, 6);

    const whatIsHappening = [summary || "Staff update from the current issue record.", status ? `Status: ${status}.` : "", posture ? `Posture: ${posture}.` : "", needsToKnowEffective ? `Focus: ${needsToKnowEffective}` : ""]
      .filter(Boolean)
      .join("\n\n");

    const confirmedFacts = confirmed
      ? `Confirmed facts:\n${confirmed.split(/\r?\n/).map((l) => `- ${l.replace(/^-+\s*/, "")}`).join("\n")}`
      : "No confirmed facts recorded yet.";

    const internalNotes =
      topInputs.length > 0
        ? "Internal notes (not confirmed facts):\n" +
          topInputs
            .map((i) => {
              const who = [i.role, i.name].filter(Boolean).join(" · ");
              return `- ${who ? `${who}: ` : ""}${cleanText(i.response) || "(empty)"}`;
            })
            .join("\n")
        : "No non-excluded internal observations recorded.";

    const evidence =
      sources.length > 0
        ? "Evidence on file:\n" +
          rankSourcesForIssue(sources)
            .slice(0, 6)
            .map((s) => `- ${s.sourceCode} · ${s.title}`)
            .join("\n")
        : "No sources linked yet.";

    const stillValidating =
      open.length > 0
        ? "Still validating:\n" + open.slice(0, 6).map((g) => `- ${formatGapLineShort(g)}`).join("\n")
        : "No open validation items.";

    return [
      { id: "draft-message", title: "Staff summary", body: whatIsHappening },
      { id: "confirmed-facts", title: "Confirmed facts", body: confirmedFacts },
      { id: "internal-notes", title: "Internal notes (not confirmed)", body: internalNotes },
      { id: "evidence", title: "Evidence (internal)", body: evidence },
      {
        id: "what-staff-should-say-do",
        title: "What staff should say / do",
        body: channelEffective || channelFromDefaults || "Follow incident lead instructions.",
      },
      { id: "still-validating", title: "Still validating", body: stillValidating },
    ];
  })();

  const mustAvoid: string[] = [
    ...grounding.doNotSay.map((l) => l.replace(/^Do not say yet /i, "Do not ")),
    "Do not present internal notes as confirmed facts.",
    "Do not paste internal evidence references into external channels.",
    "Treat as draft for review.",
  ];
  if (issueLens) {
    const risk = cleanText(issueLens.issueRisk);
    if (risk) mustAvoid.push(`Audience risk (internal): ${risk}`);
  }

  const toneParts = [toneFromIssue, toneFromGroup].filter(Boolean);
  const toneNotes =
    toneParts.length > 0
      ? toneParts.join(" ")
      : grounding.consultationIssue && profile === "staff"
        ? "Practical and direct. Separate the front-desk line from open validation items."
        : "Be practical. Separate confirmed facts from internal notes and open items.";

  return {
    templateId: "internal_staff_update",
    metadata: {
      publicHeadline: cleanText(issue.title) || "Internal staff update",
      lastRevisionLabel: nowLabel(),
      openGapsLabel: `${open.length} open question(s) / validation items`,
      audienceLabel,
      lensSource,
      issueLevelAudienceNote,
      stakeholderGroupId: group?.id ?? null,
      issueSpecificLensApplied,
      lensEnrichmentNote,
      internalNotesLabel: "Internal notes are not confirmed facts.",
    },
    sections,
    guardrails: {
      mustAvoid: [...new Set(mustAvoid)],
      toneNotes,
    },
  };
}

export function renderInternalStaffUpdateMarkdown(title: string, artifact: InternalStaffUpdateArtifact) {
  const lines: string[] = [`# ${artifact.metadata.publicHeadline || title}`, ""];
  lines.push(`*Audience: ${artifact.metadata.audienceLabel} · ${artifact.metadata.lastRevisionLabel}*`);
  lines.push(
    "",
    "**DRAFT FOR REVIEW — NOT APPROVED FOR CIRCULATION.** Check for sensitive, legal, personal, security, or unverified claims before use.",
  );
  if (artifact.metadata.issueLevelAudienceNote) lines.push("", `*${artifact.metadata.issueLevelAudienceNote}*`);
  if (artifact.metadata.lensEnrichmentNote) lines.push("", `*${artifact.metadata.lensEnrichmentNote}*`);
  if (artifact.metadata.internalNotesLabel) lines.push("", `*${artifact.metadata.internalNotesLabel}*`);
  lines.push("");
  for (const s of artifact.sections) {
    lines.push(`## ${s.title}`, "", s.body.trim(), "");
  }
  lines.push("## Guardrails (internal)", "", "**Tone:**", artifact.guardrails.toneNotes, "", "**Avoid:**");
  for (const m of artifact.guardrails.mustAvoid) lines.push(`- ${m}`);
  lines.push("");
  return lines.join("\n").trim() + "\n";
}
