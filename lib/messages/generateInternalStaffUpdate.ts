import type { Gap, InternalInput, Issue, IssueStakeholder, Source, StakeholderGroup } from "@prisma/client";

import type { InternalStaffUpdateArtifact } from "@metis/shared/messageVariant";

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

function bulletsFromParagraph(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "- (No bullet lines parsed.)";
  return lines.map((l) => `- ${l.replace(/^-+\s*/, "")}`).join("\n");
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

function formatGapLine(g: Gap) {
  const q = cleanText(g.prompt) || cleanText(g.title);
  const topic = cleanText(g.linkedSection);
  const sev = cleanText(g.severity);
  const base = q.replace(/\s+/g, " ").trim();
  const head = [topic ? `(${topic})` : null, sev ? `[${sev}]` : null].filter(Boolean).join(" ");
  return `${head ? `${head} ` : ""}${base || "Open validation item."}`.trim();
}

function formatInternalInputLine(i: InternalInput) {
  const who = [cleanText(i.role), cleanText(i.name)].filter(Boolean).join(" · ").trim();
  const body = cleanText(i.response);
  const confidence = cleanText(i.confidence);
  const ts = cleanText(i.timestampLabel);
  const linked = cleanText(i.linkedSection);
  const meta = [confidence ? `Confidence: ${confidence}` : null, ts ? `Time: ${ts}` : null, linked ? `Linked: ${linked}` : null]
    .filter(Boolean)
    .join(" · ");
  const head = who ? `${who}: ` : "";
  return `${head}${body || "(No observation text recorded.)"}${meta ? ` (${meta})` : ""}`.trim();
}

function formatSourceLine(s: Source) {
  const code = cleanText(s.sourceCode);
  const title = cleanText(s.title);
  const tier = cleanText(s.tier);
  const url = cleanText(s.url);
  const snippet = cleanText(s.snippet);
  const bits: string[] = [];
  const head = [code || null, title || null].filter(Boolean).join(" · ");
  if (head) bits.push(head);
  if (tier) bits.push(`Tier: ${tier}`);
  if (url) bits.push(`URL: ${url}`);
  if (snippet) bits.push(`Note: ${snippet}`);
  return bits.join(" — ") || "(No source details recorded.)";
}

export function generateInternalStaffUpdateArtifact(input: InternalStaffMessageGenerationInput): InternalStaffUpdateArtifact {
  const { issue, sources, gaps, internalInputs, audience } = input;

  const summary = cleanText(issue.summary);
  const confirmed = cleanText(issue.confirmedFacts);
  const posture = cleanText(issue.operatorPosture);
  const status = cleanText(issue.status);

  const isSetup = audience.kind === "setup";
  const group = audience.kind === "group" ? audience.group : null;
  const issueLens = audience.kind === "group" ? audience.issueLens : null;
  const issueSpecificLensApplied = Boolean(group && issueLens && issueLensHasContent(issueLens));

  const audienceLabel = isSetup
    ? cleanText(issue.audience) || "Staff audience"
    : (group?.name ?? "").trim() || "Staff audience";

  const lensSource = isSetup ? ("issue_audience_only" as const) : ("stakeholder_group" as const);

  const issueLevelAudienceNote = isSetup
    ? "Using the audience note from issue setup only. Choose an organisation audience group for library defaults and optional issue-specific lens notes."
    : null;

  const lensEnrichmentNote = (() => {
    if (isSetup || !group) return null;
    if (!issueLens || !issueLensHasContent(issueLens)) {
      return "No issue-specific lens added for this audience yet. Organisation defaults from the audience library are being used.";
    }
    return null;
  })();

  const needsToKnowEffective = issueLens ? cleanText(issueLens.needsToKnow) : "";
  const channelEffective = issueLens ? cleanText(issueLens.channelGuidance) : "";
  const channelFromDefaults = group ? cleanText(group.defaultChannels) : "";
  const toneFromIssue = issueLens ? cleanText(issueLens.toneAdjustment) : "";
  const toneFromGroup = group ? cleanText(group.defaultToneGuidance) : "";

  const open = openGaps(gaps).sort((a, b) => gapSeverityRank(a.severity) - gapSeverityRank(b.severity));
  const topOpen = open.slice(0, 8);

  const nonExcludedInputs = internalInputs.filter((i) => !i.excludedFromBrief);
  const topInputs = nonExcludedInputs.slice(0, 12);

  const whatIsHappening = (() => {
    const base = summary || "Staff update prepared from the current issue record.";
    const statusLine = status ? `Status: ${status}.` : "";
    const postureLine = posture ? `Posture: ${posture}.` : "";
    const focusLine = needsToKnowEffective ? `For this audience, focus on: ${needsToKnowEffective}` : "";
    return [base, statusLine, postureLine, focusLine].filter(Boolean).join("\n\n").trim();
  })();

  const confirmedFacts = confirmed ? `Confirmed facts:\n${bulletsFromParagraph(confirmed)}` : "No confirmed facts recorded yet.";

  const internalNotes = (() => {
    if (!topInputs.length) {
      return "No non-excluded internal observations have been recorded yet.";
    }
    const lines = topInputs.map(formatInternalInputLine).filter(Boolean);
    const extra = nonExcludedInputs.length > topInputs.length ? `\n\n(${nonExcludedInputs.length - topInputs.length} more internal notes not shown.)` : "";
    return (
      "Internal notes (not confirmed facts):\nThese notes may be incomplete, sensitive, or wrong. Do not treat as confirmed facts.\n\n" +
      lines.map((l) => `- ${l}`).join("\n") +
      extra
    ).trim();
  })();

  const evidence = (() => {
    if (!sources.length) return "No evidence references recorded yet.";
    const sorted = [...sources].sort((a, b) => {
      const d = b.createdAt.getTime() - a.createdAt.getTime();
      if (d !== 0) return d;
      return cleanText(a.sourceCode).localeCompare(cleanText(b.sourceCode));
    });
    const top = sorted.slice(0, 12);
    const lines = top.map(formatSourceLine).filter(Boolean);
    const extra = sources.length > top.length ? `\n\n(${sources.length - top.length} more evidence items not shown.)` : "";
    return ("Evidence & references (internal):\n\n" + lines.map((l) => `- ${l}`).join("\n") + extra).trim();
  })();

  const whatWeAreDoing = (() => {
    const parts: string[] = [];
    if (status || posture) {
      parts.push(
        `Operational stance: ${status ? status : "In progress"}${posture ? ` · ${posture}` : ""}.`.trim(),
      );
    } else {
      parts.push("Operational stance: In progress.");
    }
    return parts.join("\n\n");
  })();

  const whatStaffShouldSayDo = (() => {
    if (channelEffective) {
      return `Practical guidance (issue lens):\n${channelEffective}`.trim();
    }
    if (channelFromDefaults) {
      return `Practical guidance (audience library defaults):\n${channelFromDefaults}`.trim();
    }
    return "No channel guidance recorded yet. Use internal comms channels and follow incident lead instructions.";
  })();

  const stillValidating = (() => {
    if (!topOpen.length) return "No open validation items recorded yet.";
    const lines = topOpen.map(formatGapLine).filter(Boolean);
    return (
      "Still validating:\n\n" +
      lines.map((l) => `- ${l}`).join("\n") +
      (open.length > topOpen.length ? `\n\n(${open.length - topOpen.length} more open items not shown.)` : "")
    ).trim();
  })();

  const nextUpdate = "Update this internal note when confirmed facts change or when new evidence is logged. Use the external update template for any public-facing copy.";

  const mustAvoid: string[] = [
    "Do not present internal notes as confirmed facts.",
    "Do not paste internal evidence references into external channels; use the external update template instead.",
    "Treat this as a draft for review; internal notes may be wrong or sensitive even when useful for investigation.",
  ];
  if (issueLens) {
    const risk = cleanText(issueLens.issueRisk);
    if (risk) mustAvoid.push(`Audience risk note (internal): ${risk}`);
  }

  const toneParts = [toneFromIssue, toneFromGroup].filter(Boolean);
  const toneNotes =
    toneParts.length > 0
      ? toneParts.join(" ")
      : "Be practical and operational. Clearly separate confirmed facts from internal notes and open validation items.";

  const sections: InternalStaffUpdateArtifact["sections"] = [
    { id: "what-is-happening", title: "What is happening (staff summary)", body: whatIsHappening },
    { id: "confirmed-facts", title: "Confirmed facts", body: confirmedFacts },
    { id: "internal-notes", title: "Internal notes (not confirmed facts)", body: internalNotes },
    { id: "evidence", title: "Evidence & references (internal)", body: evidence },
    { id: "what-we-are-doing", title: "What we are doing", body: whatWeAreDoing },
    { id: "what-staff-should-say-do", title: "What staff should say / do", body: whatStaffShouldSayDo },
    { id: "still-validating", title: "Still validating", body: stillValidating },
    { id: "next-update", title: "Next update", body: nextUpdate },
  ];

  return {
    templateId: "internal_staff_update",
    metadata: {
      publicHeadline: cleanText(issue.title) || "Internal staff update",
      lastRevisionLabel: nowLabel(),
      openGapsLabel: `${open.length} open validation items`,
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
      mustAvoid,
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

