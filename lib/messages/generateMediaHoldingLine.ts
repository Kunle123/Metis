import type { Gap, Issue, IssueStakeholder, StakeholderGroup } from "@prisma/client";

import type { MediaHoldingLineArtifact } from "@metis/shared/messageVariant";

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

function issueLensHasContent(row: IssueStakeholder) {
  return Boolean(
    cleanText(row.needsToKnow) ||
      cleanText(row.issueRisk) ||
      cleanText(row.channelGuidance) ||
      cleanText(row.toneAdjustment) ||
      cleanText(row.notes),
  );
}

function bulletsFromParagraph(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "- (No bullet lines parsed.)";
  return lines.map((l) => `- ${l.replace(/^-+\s*/, "")}`).join("\n");
}

function genericUnderReviewBullets(openCount: number) {
  if (openCount <= 0) return [];
  // Deterministic, generic only; never derived from gap prompt text.
  const pool = [
    "We are still establishing the full scope and timeline.",
    "We are still validating which users and services were affected.",
    "We are reviewing logs and internal telemetry to confirm the sequence of events.",
    "We are still confirming whether any customer data was impacted.",
    "We are assessing mitigations and any needed follow-up actions.",
  ];
  const n = Math.min(3, pool.length);
  return pool.slice(0, n).map((x) => `- ${x}`);
}

export function generateMediaHoldingLineArtifact(input: MediaHoldingLineGenerationInput): MediaHoldingLineArtifact {
  const { issue, gaps, audience } = input;

  const summary = cleanText(issue.summary);
  const confirmed = cleanText(issue.confirmedFacts);

  const open = openGaps(gaps).sort((a, b) => gapSeverityRank(a.severity) - gapSeverityRank(b.severity));

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

  const hasConfirmed = Boolean(confirmed);

  const holdingLine = (() => {
    if (hasConfirmed) {
      return (
        "We are aware of an incident and are actively working to address it.\n\n" +
        "We will provide updates through our official channels as we confirm more information."
      ).trim();
    }
    // Cautious interim wording; may reference summary lightly but does not claim confirmation.
    const lead = summary
      ? `We are aware of a reported issue related to: ${summary.replace(/\\s+/g, " ").trim()}.`
      : "We are aware of a reported issue and are investigating.";
    return `${lead}\n\nWe will share more once we have confirmed information.`.trim();
  })();

  const confirmBlock = hasConfirmed
    ? `What we can confirm:\n${bulletsFromParagraph(confirmed)}`
    : "What we can confirm:\n- No confirmed facts are recorded yet.";

  const underReviewLines = genericUnderReviewBullets(open.length);
  const underReviewBlock = underReviewLines.length
    ? `What is under review:\n${underReviewLines.join("\n")}`
    : "What is under review:\n- There are no open review items recorded yet.";

  const ifPressed =
    "If pressed:\n- We are actively investigating and will share updates once details are confirmed.\n- We are prioritising service stability and accurate information over speculation.";

  const linesToAvoid =
    "Lines to avoid:\n- Speculating on cause, blame, or timelines.\n- Sharing unverified claims.\n- Referencing internal evidence, logs, or source codes.\n- Quoting internal notes or observations.";

  const mustAvoid: string[] = [
    "Do not quote or paraphrase internal observations in external channels.",
    "Do not share internal source identifiers or evidence appendix details publicly.",
    "Do not speculate beyond what is stated in confirmed facts and this update.",
    "Treat this as a draft for review; it may contain sensitive or unverified claims from the issue record.",
  ];

  const toneNotes =
    "Short, calm, and press-office style. Prefer confirmed facts. Use cautious interim language when facts are not confirmed. Avoid names, allegations, and technical specifics unless explicitly confirmed and approved.";

  const sections: MediaHoldingLineArtifact["sections"] = [
    { id: "holding-line", title: "Holding line (public)", body: holdingLine },
    { id: "what-we-can-confirm", title: "What we can confirm (public)", body: confirmBlock },
    { id: "under-review", title: "What is under review (public)", body: underReviewBlock },
    { id: "if-pressed", title: "If pressed (guidance)", body: ifPressed },
    { id: "lines-to-avoid", title: "Lines to avoid (do not say)", body: linesToAvoid },
  ];

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
      mustAvoid,
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

