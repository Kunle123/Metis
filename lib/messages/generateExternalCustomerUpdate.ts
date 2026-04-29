import type { Gap, Issue, IssueStakeholder, Source, StakeholderGroup } from "@prisma/client";

import type { MessageVariantArtifact } from "@metis/shared/messageVariant";

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

function openGaps(gaps: Gap[]) {
  return gaps.filter((g) => g.status === "Open");
}

function gapSeverityRank(s: string) {
  const x = s.toLowerCase();
  if (x.includes("critical")) return 0;
  if (x.includes("high")) return 1;
  if (x.includes("important")) return 2;
  if (x.includes("normal")) return 3;
  return 4;
}

function formatUncertaintyLine(g: Gap) {
  const q = cleanText(g.prompt) || cleanText(g.title);
  if (!q) return "";
  const topic = cleanText(g.linkedSection);
  const base = q.replace(/\s+/g, " ").trim();
  if (!base) return "";
  if (topic) {
    return `We are still working to confirm details related to ${topic}: ${base.endsWith("?") ? base : `${base}?`}`;
  }
  return base.endsWith("?") ? `We are still working to answer: ${base}` : `We are still working to answer: ${base}?`;
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

export function generateExternalCustomerResidentStudentArtifact(input: ExternalMessageGenerationInput): MessageVariantArtifact {
  const { issue, sources, gaps, audience } = input;
  const summary = cleanText(issue.summary);
  const confirmed = cleanText(issue.confirmedFacts);
  const open = openGaps(gaps).sort((a, b) => gapSeverityRank(a.severity) - gapSeverityRank(b.severity));
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

  const whatIsHappening = (() => {
    if (confirmed) {
      return `${summary ? `${summary}\n\n` : ""}What we can confirm:\n${bulletsFromParagraph(confirmed)}`.trim();
    }
    if (summary) {
      return `${summary}\n\nThis is an interim update. Formal confirmed facts are still being recorded; we will share more when we can do so accurately.`.trim();
    }
    return "We are preparing a factual update for those affected. Confirmed details are still being recorded in our internal issue record; we will post more when we can do so accurately.";
  })();

  const whatWeAreDoing = (() => {
    const posture = cleanText(issue.operatorPosture);
    const status = cleanText(issue.status);
    const parts: string[] = [];
    if (status || posture) {
      parts.push(
        `Our team is actively working on this matter${status ? ` (current status: ${status})` : ""}${posture ? `. Posture: ${posture}.` : "."}`,
      );
    } else {
      parts.push("Our team is actively working on this matter and will share updates as soon as we have confirmed information.");
    }
    if (sources.length > 0) {
      parts.push(
        "Supporting materials are being coordinated internally; this public update reflects only what is confirmed above and does not include internal reference details.",
      );
    } else {
      parts.push(
        "We are still assembling the supporting information we can reference for external statements. Until that is in place, treat this update as provisional except where explicitly confirmed above.",
      );
    }
    if (needsToKnowEffective) {
      parts.push(`For this audience, our focus is: ${needsToKnowEffective}`);
    }
    return parts.join("\n\n");
  })();

  const whatYouCanDo = (() => {
    if (channelEffective) {
      return `Practical guidance:\n${channelEffective}\n\nIf you need help, use the contact channels your organisation has published for this type of issue.`;
    }
    if (channelFromDefaults) {
      return `Channel guidance (from organisation audience group defaults):\n${channelFromDefaults}\n\nIf you need help, use the contact channels your organisation has published for this type of issue.`;
    }
    return "No specific actions are recorded in the issue template yet. If you need help, use the contact channels your organisation has published for this type of issue.";
  })();

  const whatWeCantConfirm = (() => {
    if (!topOpen.length) {
      return "There are no open clarification items on the issue list that require a public caveat at this time. If the situation changes, we will update this message.";
    }
    const lines = topOpen.map(formatUncertaintyLine).filter(Boolean);
    return (
      "Some operational details are still being confirmed. Until we can state them accurately:\n\n" +
      lines.map((l) => `- ${l}`).join("\n") +
      (open.length > topOpen.length ? `\n\nAdditional items remain under internal review.` : "")
    );
  })();

  const nextUpdate =
    "We will post an update as soon as we have new confirmed information. Please rely on official channels rather than informal summaries.";

  const mustAvoid: string[] = [
    "Do not quote or paraphrase internal observations in external channels.",
    "Do not share internal source identifiers or evidence appendix details publicly.",
    "Do not speculate beyond what is stated in confirmed facts and this update.",
    "Treat this as a draft for review; it may contain sensitive or unverified claims from the issue record.",
  ];
  if (issueLens) {
    const risk = cleanText(issueLens.issueRisk);
    if (risk) mustAvoid.push(`Audience risk note (internal): ${risk}`);
  }

  const toneParts: string[] = [];
  if (toneFromIssue) toneParts.push(toneFromIssue);
  if (toneFromGroup) toneParts.push(toneFromGroup);
  const toneNotes =
    toneParts.length > 0
      ? toneParts.join(" ")
      : "Use a calm, factual tone. Avoid blame, internal jargon, and language that could read as a firm commitment where details are still open.";

  const sections: MessageVariantArtifact["sections"] = [
    { id: "what-is-happening", title: "What is happening", body: whatIsHappening },
    { id: "what-we-are-doing", title: "What we are doing", body: whatWeAreDoing },
    { id: "what-you-can-do", title: "What you can do", body: whatYouCanDo },
    { id: "what-we-cant-confirm-yet", title: "What we cannot confirm yet", body: whatWeCantConfirm },
    { id: "next-update", title: "Next update", body: nextUpdate },
  ];

  return {
    templateId: "external_customer_resident_student",
    metadata: {
      publicHeadline: cleanText(issue.title) || "Service update",
      lastRevisionLabel: nowLabel(),
      openGapsLabel: `${open.length} open on the issue list`,
      audienceLabel,
      lensSource,
      issueLevelAudienceNote,
      stakeholderGroupId: group?.id ?? null,
      issueSpecificLensApplied,
      lensEnrichmentNote,
    },
    sections,
    guardrails: {
      mustAvoid,
      toneNotes,
    },
  };
}

function bulletsFromParagraph(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "- (No bullet lines parsed.)";
  return lines.map((l) => `- ${l.replace(/^-+\s*/, "")}`).join("\n");
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
