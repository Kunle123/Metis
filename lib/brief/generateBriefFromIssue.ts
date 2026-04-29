import type { Issue, Source, Gap, InternalInput, IssueStakeholder, StakeholderGroup } from "@prisma/client";

import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";

const CAP_EX_SOURCES = 8;
const CAP_EX_OPEN_GAPS = 8;
const CAP_EX_OBS = 5;
const CAP_EX_AUDIENCE = 5;
const CAP_FULL_GAPS = 20;
const CAP_FULL_SOURCES_NARRATIVE = 12;
const CAP_FULL_OBS = 20;

function nowLabel() {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm} CET`;
}

function confidenceFromStatus(status: string) {
  const s = status.toLowerCase();
  if (s.includes("validation")) return "Needs validation" as const;
  if (s.includes("open gap")) return "Unclear" as const;
  if (s.includes("ready")) return "Likely" as const;
  return "Likely" as const;
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function paragraphOrFallback(text: string, fallback: string) {
  return text.length ? text : fallback;
}

function bulletsFromMultiline(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "";
  return lines.map((l) => `- ${l.replace(/^-+\s*/, "")}`).join("\n");
}

/**
 * Splits a single block of "open questions" into discrete items for readability.
 * Conservative: if nothing clearly separates items, the original string is kept as one.
 */
function splitIntakeOpenQuestions(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  if (t.includes("\n")) {
    return t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  }
  if (t.includes(";")) {
    const parts = t.split(";").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }
  if (t.includes("? ")) {
    return t
      .split(/\?\s+/)
      .map((p, i, arr) => {
        const piece = p.trim();
        if (!piece.length) return "";
        if (i < arr.length - 1) return piece.endsWith("?") ? piece : `${piece}?`;
        return piece;
      })
      .filter(Boolean);
  }
  return [t];
}

function intakeOpenQuestionsAsBulletLines(text: string): string {
  const t = cleanText(text);
  if (!t) return "";
  const parts = splitIntakeOpenQuestions(t);
  if (parts.length <= 1) return parts[0] ?? "";
  return parts.map((l) => `- ${l.replace(/^-+\s*/, "")}`).join("\n");
}

function capLines(s: string, maxLines: number) {
  const lines = s.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length <= maxLines) return s.trim();
  const head = lines.slice(0, maxLines);
  return `${head.join("\n")}\n\n…${lines.length - maxLines} more line(s) in the record; see full issue fields for the complete list.`;
}

function stripTrailingPunctuation(s: string) {
  return s.replace(/[.。…!?)\]]+$/u, "").trimEnd();
}

function normalizeNeedText(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const withoutLead = trimmed
    .replace(/^[-•*]+\s+/u, "")
    .replace(/^\d+\s*[\).]\s+/u, "");
  const withoutTail = stripTrailingPunctuation(withoutLead);
  return withoutTail.toLowerCase().replace(/\s+/g, " ").trim();
}

function dedupeUnassignedNeedsAgainstIntake(openQuestionsRaw: string, unassigned: Gap[]) {
  const intakeItems = splitIntakeOpenQuestions(openQuestionsRaw)
    .map(normalizeNeedText)
    .filter(Boolean);
  const intakeSet = new Set(intakeItems);
  if (!intakeSet.size || !unassigned.length) {
    return { kept: unassigned, allWereDuplicates: false };
  }

  const kept = unassigned.filter((g) => {
    const raw = (g.prompt || g.title || "").trim();
    const key = normalizeNeedText(raw);
    if (!key) return true;
    return !intakeSet.has(key);
  });

  return { kept, allWereDuplicates: kept.length === 0 && unassigned.length > 0 };
}

function sentence(s: string) {
  const t = s.trim();
  if (!t) return "";
  return `${stripTrailingPunctuation(t)}.`;
}

function sanitizeBriefUserText(raw: string) {
  const input = raw ?? "";
  if (!input.trim()) return input;
  return input
    .replace(/\bgaps\b/gi, (m) => (m[0] === "G" ? "Open questions" : "open questions"))
    .replace(/\bgap\b/gi, (m) => (m[0] === "G" ? "Open question" : "open question"));
}

function severityRank(severity: string | null | undefined) {
  if (!severity) return 9;
  if (severity === "Critical") return 0;
  if (severity === "Important") return 1;
  if (severity === "Watch") return 2;
  return 9;
}

function capBulletBlock(text: string, maxBullets: number) {
  const raw = text.trim();
  if (!raw) return "";
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= maxBullets) return raw;
  const head = lines.slice(0, maxBullets);
  return `${head.join("\n")}\n- …${lines.length - maxBullets} more item(s) in the record`;
}

function topOpenQuestionsSummary({
  openQuestionsRaw,
  openGaps,
  cap = 6,
}: {
  openQuestionsRaw: string;
  openGaps: Gap[];
  cap?: number;
}) {
  const intakeItems = splitIntakeOpenQuestions(openQuestionsRaw)
    .map((s) => s.trim())
    .filter(Boolean);
  const intakeNormalized = new Set(intakeItems.map(normalizeNeedText).filter(Boolean));

  const gapsSorted = [...openGaps].sort((a, b) => {
    const ar = severityRank(a.severity);
    const br = severityRank(b.severity);
    if (ar !== br) return ar - br;
    return String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? ""));
  });

  const gapLines = gapsSorted
    .map((g) => {
      const raw = (g.prompt || g.title || "").trim();
      if (!raw) return "";
      const key = normalizeNeedText(raw);
      if (key && intakeNormalized.has(key)) return "";
      const sev = g.severity ? `[${g.severity}] ` : "";
      const section = cleanText((g as any).linkedSection) ? ` — ${(g as any).linkedSection}` : "";
      return `- ${sev}${stripTrailingPunctuation(raw)}${section}`;
    })
    .filter(Boolean);

  const out: string[] = [];
  for (const item of intakeItems) {
    out.push(`- ${stripTrailingPunctuation(item.replace(/^-+\s*/u, "").replace(/^•\s*/u, ""))}`);
    if (out.length >= cap) break;
  }
  for (const line of gapLines) {
    if (out.length >= cap) break;
    out.push(line);
  }

  return out.join("\n");
}

export type BriefGenerationInput = {
  issue: Issue;
  sources: Source[];
  gaps: Gap[];
  internalInputs: InternalInput[];
  issueStakeholders: (IssueStakeholder & { stakeholderGroup: StakeholderGroup })[];
};

function openGaps(gaps: Gap[]) {
  return gaps.filter((g) => g.status === "Open");
}

function formatSourceForExecutive(s: Source) {
  const bit = [s.tier, s.linkedSection ?? "—", s.reliability ?? "reliability not set"].filter(Boolean).join(" · ");
  return `• ${s.title} — ${s.sourceCode} (${bit})`;
}

function formatGapsForExecutive(open: Gap[], cap: number) {
  if (!open.length) return "No open questions are recorded in the tracker yet.";
  const slice = open.slice(0, cap);
  const lines = slice.map(
    (g) => `• [${g.severity}] ${g.prompt.trim() || g.title}${g.linkedSection ? ` — ${g.linkedSection}` : ""}`,
  );
  if (open.length > cap) {
    return `${lines.join("\n")}\n\n…${open.length - cap} additional open question(s). See the Open questions view for the full list.`;
  }
  return lines.join("\n");
}

function formatGapsKeyUnknownsLeadership(open: Gap[], cap: number) {
  if (!open.length) return "No open clarification items remain on the current list.";
  const slice = open.slice(0, cap);
  const sev = (g: Gap) => (g.severity ? `${g.severity}: ` : "");
  const lines = slice.map(
    (g) => `• ${sev(g)}${(g.prompt.trim() || g.title).replace(/\n/g, " ")}${g.linkedSection ? ` — ${g.linkedSection}` : ""}`,
  );
  if (open.length > cap) {
    return `${lines.join("\n")}\n\n…${open.length - cap} more item(s) on the list.`;
  }
  return lines.join("\n");
}

function gapToLeadershipDecision(g: Gap): string {
  const label = (g.prompt || g.title).trim();
  const topic = label || "the outstanding clarification";
  const s = (g.severity || "").toLowerCase();
  if (s === "high" || s === "critical") {
    return `Assign an owner and deadline to close “${stripTrailingPunctuation(topic)}” before any external line or irreversible commitment.`;
  }
  if (s === "medium" || s === "moderate" || s === "med") {
    return `Set a deadline to resolve “${stripTrailingPunctuation(topic)}”, or explicitly document the interim position and accepted risk.`;
  }
  return `Confirm who owns “${stripTrailingPunctuation(topic)}” and by when, or explicitly deprioritise it and why.`;
}

function formatGapsForFull(gaps: Gap[], cap: number) {
  if (!gaps.length) return "No open questions recorded yet.";
  const slice = gaps.slice(0, cap);
  const lines = slice.map(
    (g) =>
      `- [${g.status}] [${g.severity}] ${g.prompt.trim() || g.title}${g.linkedSection ? ` · ${g.linkedSection}` : ""}`,
  );
  if (gaps.length > cap) {
    return `${lines.join("\n")}\n\n…${gaps.length - cap} more open question(s) in the tracker.`;
  }
  return lines.join("\n");
}

function formatObsForExecutive(inputs: InternalInput[], cap: number, options?: { leadership?: boolean }) {
  if (!inputs.length) return "No internal observations recorded yet.";
  const leadership = options?.leadership ?? false;
  const confidenceRank: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
  const rankOf = (c: unknown) => (typeof c === "string" && c in confidenceRank ? confidenceRank[c] : 0);

  const sorted = [...inputs].sort((a, b) => rankOf(b.confidence) - rankOf(a.confidence));
  const preferred = sorted.filter((i) => String(i.confidence) !== "Low");
  const shown = (preferred.length ? preferred : sorted).slice(0, cap);

  const preface = leadership
    ? "Internal notes are team-sourced and may be incomplete; treat them as context, not as confirmed facts."
    : "";

  const lines = shown.map((i) => {
    const response = i.response.slice(0, 200);
    const clipped = i.response.length > 200 ? "…" : "";
    return `• ${i.role} · ${i.name}: ${response}${clipped}`;
  });

  const lowCount = inputs.filter((i) => String(i.confidence) === "Low").length;
  const lowShownCount = shown.filter((i) => String(i.confidence) === "Low").length;
  const lowOmitted = Math.max(0, lowCount - lowShownCount);

  const tail: string[] = [];
  if (sorted.length > shown.length) {
    tail.push(`…${sorted.length - shown.length} more observation(s) not shown here.`);
  }
  if (leadership && lowOmitted > 0) {
    tail.push(`Low-confidence notes exist (${lowOmitted} not shown); review the full observations list before lifting them into leadership narrative.`);
  }
  if (tail.length) {
    tail.push(leadership ? "See the full observations list for details." : "See the observations list for the full set.");
  }

  return [preface, lines.join("\n"), tail.length ? `\n\n${tail.join("\n")}` : ""].filter(Boolean).join("\n");
}

function formatObsForFull(inputs: InternalInput[], cap: number) {
  if (!inputs.length) return "No internal observations recorded yet.";
  const confidenceRank: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
  const rankOf = (c: unknown) => (typeof c === "string" && c in confidenceRank ? confidenceRank[c] : 0);
  const sorted = [...inputs].sort((a, b) => rankOf(b.confidence) - rankOf(a.confidence));
  const preferred = sorted.filter((i) => String(i.confidence) !== "Low");
  const shown = (preferred.length ? preferred : sorted).slice(0, cap);

  const lines = shown.map((i) => {
    const section = i.linkedSection ? `Section: ${i.linkedSection} · ` : "";
    return `- ${i.role} · ${i.name} · ${i.confidence}\n  ${section}${i.response}`;
  });

  const lowCount = inputs.filter((i) => String(i.confidence) === "Low").length;
  const lowShownCount = shown.filter((i) => String(i.confidence) === "Low").length;
  const lowOmitted = Math.max(0, lowCount - lowShownCount);

  const tail: string[] = [];
  if (sorted.length > shown.length) {
    tail.push(`…${sorted.length - shown.length} more observation(s) not shown here.`);
  }
  if (lowOmitted > 0) {
    tail.push(`Low-confidence notes exist (${lowOmitted} not shown); review the full observations list before lifting them into formal output.`);
  }

  return `${lines.join("\n\n")}${tail.length ? `\n\n${tail.join("\n")}` : ""}`;
}

function formatAudienceImplications(
  issueAudience: string | null,
  rows: (IssueStakeholder & { stakeholderGroup: StakeholderGroup })[],
  cap: number,
  options?: { issueAudienceInBriefHeader: boolean; leadershipVoice?: boolean },
) {
  const fromIssue = cleanText(issueAudience ?? "");
  const headerAudience = options?.issueAudienceInBriefHeader ?? false;
  const leadership = options?.leadershipVoice ?? false;
  const parts: string[] = [];

  if (fromIssue && !headerAudience) {
    parts.push(`Issue-level audience note (intake): ${fromIssue}`);
  }

  if (rows.length) {
    if (fromIssue && headerAudience) {
      parts.push("Stakeholder lens (the issue audience is listed in the brief header; detail by group):");
    }
    const slice = rows.slice(0, cap);
    for (const r of slice) {
      const g = r.stakeholderGroup.name;
      const line = [r.priority !== "Normal" ? `Priority: ${r.priority}` : null, cleanText(r.needsToKnow) ? `Need to know: ${r.needsToKnow.trim()}` : null, cleanText(r.issueRisk) ? `Risk: ${r.issueRisk.trim()}` : null, cleanText(r.channelGuidance) ? `Channels: ${r.channelGuidance.trim()}` : null]
        .filter(Boolean)
        .join(" · ");
      parts.push(`• ${g}: ${line || "No issue-specific output notes yet."}`);
    }
    if (rows.length > cap) {
      parts.push(`…${rows.length - cap} additional audience group(s) on this issue.`);
    }
  } else if (fromIssue && headerAudience) {
    parts.push(
      leadership
        ? "The intended audience is in the record header. Add group-level lens and channel notes when the narrative must vary by stakeholder."
        : "The issue audience is in the record header. No per-group notes are added yet. Add group-level lens and channel notes when the narrative must vary by stakeholder.",
    );
  } else if (!fromIssue) {
    parts.push("No audience-lens group selections and no issue-level audience note recorded yet.");
  }

  return parts.join("\n");
}

function evidenceBaseExecutive(sources: Source[], total: number) {
  if (!total) {
    return "No sources are linked yet. Add sources to establish an evidence base.";
  }
  const lines = sources.slice(0, CAP_EX_SOURCES).map((s) => formatSourceForExecutive(s));
  const out = [`${total} source(s) on file.`, "", ...lines];
  if (total > CAP_EX_SOURCES) {
    out.push("");
    out.push(`…and ${total - CAP_EX_SOURCES} more (see the full issue brief and sources).`);
  }
  return out.join("\n");
}

function evidenceBaseLeadership(sources: Source[], total: number) {
  if (!total) {
    return "No linked source material is on file yet. Add sources so leadership points can be traced to an evidence line.";
  }
  const lines = sources.slice(0, CAP_EX_SOURCES).map((s) => formatSourceForExecutive(s));
  const out = [`${total} source(s) on file.`, "", ...lines];
  if (total > CAP_EX_SOURCES) {
    out.push("");
    out.push(`…and ${total - CAP_EX_SOURCES} more; review the full register when the narrative is sensitive.`);
  }
  return out.join("\n");
}

function sourcesNarrativeFull(sources: Source[], total: number) {
  if (!total) return "No sources are linked yet. Evidence should be added before broad external lines are taken as settled.";
  const slice = sources.slice(0, CAP_FULL_SOURCES_NARRATIVE);
  const lines = slice.map(
    (s) => `- ${s.sourceCode} — ${s.title} (${s.tier}${s.linkedSection ? `, ${s.linkedSection}` : ""})`,
  );
  if (total > slice.length) {
    lines.push(`…${total - slice.length} more source(s) in the register.`);
  }
  return lines.join("\n");
}

export function generateBriefFromIssue(input: BriefGenerationInput, mode: BriefMode): BriefArtifact {
  const { issue, sources, gaps, internalInputs, issueStakeholders } = input;
  const isExecutive = mode === "executive";
  const updatedAtLabel = nowLabel();
  const confidence = confidenceFromStatus(issue.status);
  const excludedObsCount = internalInputs.filter((i: any) => Boolean((i as any).excludedFromBrief)).length;
  const internalInputsForBrief = internalInputs.filter((i: any) => !Boolean((i as any).excludedFromBrief));

  const ledeBase = cleanText(issue.summary);
  const lede =
    ledeBase.length > 220 ? `${ledeBase.slice(0, 217).trimEnd()}…` : paragraphOrFallback(ledeBase, "No working line recorded yet.");

  const summary = cleanText(issue.summary);
  const titleLine = cleanText(issue.title);
  const confirmedFacts = cleanText(issue.confirmedFacts ?? "");
  const openQuestions = cleanText(issue.openQuestions ?? "");
  const context = sanitizeBriefUserText(cleanText(issue.context ?? ""));

  const confirmedBlock = paragraphOrFallback(
    bulletsFromMultiline(confirmedFacts),
    "No confirmed facts recorded yet.",
  );
  const unknownsFromIntake = paragraphOrFallback(intakeOpenQuestionsAsBulletLines(openQuestions), "");

  const openG = openGaps(gaps);
  const topOpenQuestions = topOpenQuestionsSummary({ openQuestionsRaw: openQuestions, openGaps: openG, cap: 6 });
  const keyUnknownsCombined = (() => {
    const a = cleanText(unknownsFromIntake) ? `From intake (open questions)\n${capLines(unknownsFromIntake, 14)}` : "";
    const withSection = openG.filter((g) => cleanText((g as any).linkedSection));
    const unassignedAll = openG.filter((g) => !cleanText((g as any).linkedSection));
    const { kept: unassigned, allWereDuplicates } = dedupeUnassignedNeedsAgainstIntake(openQuestions, unassignedAll);
    const b = openG.length
      ? [
          withSection.length ? `Tagged to an impact area\n${formatGapsForExecutive(withSection, CAP_EX_OPEN_GAPS)}` : "",
          unassigned.length
            ? `Additional open questions\n${formatGapsForExecutive(unassigned, CAP_EX_OPEN_GAPS)}`
            : allWereDuplicates
              ? "Additional open questions\nNo additional open questions beyond intake questions."
              : "",
        ]
          .filter(Boolean)
          .join("\n\n")
      : "No open questions recorded.";
    return [a, b].filter(Boolean).join("\n\n");
  })();

  const recommendedActionsForFull: string[] = (() => {
    const out: string[] = [];
    const oqItems = splitIntakeOpenQuestions(openQuestions);
    for (const g of openG.slice(0, 2)) {
      const label = (g.prompt || g.title).trim();
      if (label) {
        const topic = stripTrailingPunctuation(label);
        const related = g.linkedSection ? ` Related: ${stripTrailingPunctuation(g.linkedSection)}.` : "";
        out.push(
          `Assign an owner and deadline to close: “${topic}”.${related}`,
        );
      }
    }
    if (sources.length) {
      const top = sources.slice(0, 2).map((s) => `${s.title} (${s.tier})`);
      out.push(
        `Cite the evidence base (${sources.length} on file), starting with: ${top.join("; ")}${sources.length > 2 ? " …" : "."}`,
      );
    } else {
      out.push("Link at least one source so any external or leadership line can be traced to verifiable material.");
    }
    if (cleanText(issue.ownerName ?? "")) {
      out.push(`Route the next update through the named owner: ${issue.ownerName}.`);
    } else {
      out.push("Assign a named issue owner in the record for cadence and sign-off.");
    }
    if (cleanText(issue.audience ?? "") && out.length < 5) {
      out.push(sentence(`Calibrate the line for the recorded audience: ${issue.audience?.trim()}`));
    }
    if (out.length < 3 && oqItems.length) {
      out.push("Work through the open intake questions listed under Key unknowns before making firm external commitments.");
    }
    if (out.length < 2) {
      out.push("Confirm what is still under validation before broad or external circulation.");
    }
    return out.slice(0, 5);
  })();

  const recommendedBodyForFull = recommendedActionsForFull.map((x, i) => `${i + 1}) ${x}`).join("\n");

  const recommendedActionsForLeadership: string[] = (() => {
    const out: string[] = [];
    const oqItems = splitIntakeOpenQuestions(openQuestions);
    for (const g of openG.slice(0, 2)) {
      const line = (g.prompt || g.title).trim();
      if (line) {
        out.push(gapToLeadershipDecision(g));
      }
    }
    if (sources.length) {
      const top = sources.slice(0, 2).map((s) => `${s.title} (${s.tier})`);
      out.push(
        `For any external or board-facing line, cite linked sources (${sources.length} on file). Start with: ${top.join("; ")}${sources.length > 2 ? " …" : "."}`,
      );
    } else {
      out.push("Establish at least one linked source so the narrative can be traced to verifiable material.");
    }
    if (cleanText(issue.ownerName ?? "")) {
      out.push(`Accountable owner for the next update and sign-off: ${issue.ownerName}.`);
    } else {
      out.push("Assign a named owner for the next update and sign-off.");
    }
    if (cleanText(issue.audience ?? "") && out.length < 5) {
      out.push(sentence(`Stress-test the line against the intended audience: ${issue.audience?.trim()}`));
    }
    if (out.length < 3 && oqItems.length) {
      out.push("Work through the open questions in this brief before making firm external commitments.");
    }
    if (out.length < 2) {
      out.push("Validate what is still in motion before broad circulation.");
    }
    return out.slice(0, 5);
  })();

  const recommendedBodyForLeadership = recommendedActionsForLeadership.map((x, i) => `${i + 1}) ${x}`).join("\n");

  const guardrails = [
    "Do not state causes, scope, or impact that are not supported by confirmed facts, linked sources, or attributable observations.",
    openG.length
      ? `There are ${openG.length} open question(s) in the tracker; treat them as open until answered with attributable input.`
      : "If new unknowns appear, record them as open questions before treating them as settled.",
    "Avoid speculative or escalatory language; align any external line with the recorded audience notes and validation posture.",
  ].join("\n\n");

  const guardrailsLeadership = [
    "Do not state causes, scope, or impact that are not supported by confirmed facts, linked sources, or attributable observations.",
    openG.length
      ? `There are ${openG.length} open question(s) on the list; treat them as open until attributable input or confirmed intake updates answer them.`
      : "If new material unknowns appear, record them as open questions before treating them as settled for leadership or external use.",
    "Avoid speculative or escalatory language; align any external line with audience notes and the issue’s validation posture.",
  ].join("\n\n");

  const situationBody = (() => {
    const bits: string[] = [];
    if (context.length) bits.push(capLines(context, 8));
    if (lede.length) bits.push(`Current position:\n${lede}`);
    if (!bits.length) {
      return "Title and issue summary are not recorded yet. Add a short summary and context so the brief reads as a coherent note.";
    }
    return bits.join("\n\n");
  })();

  const situationBodyLeadership = (() => {
    const bits: string[] = [];
    if (context.length) bits.push(capLines(context, 8));
    if (lede.length) bits.push(`Current position:\n${lede}`);
    if (!bits.length) return "Current position is not recorded yet.";
    return bits.join("\n\n");
  })();

  const currentAssessment = [
    `Status: ${issue.status}`,
    `Severity: ${issue.severity}`,
    `Urgency: ${issue.priority}`,
    `Briefing posture: ${issue.operatorPosture}`,
    `Open questions: ${issue.openGapsCount} (tracker: ${openG.length} open)`,
    cleanText(issue.ownerName ?? "") ? `Issue owner: ${issue.ownerName}` : "Issue owner: not recorded yet.",
  ].join("\n");

  const currentAssessmentLeadership = [
    `Status: ${issue.status}`,
    `Severity: ${issue.severity}`,
    `Urgency: ${issue.priority}`,
    `Briefing posture: ${issue.operatorPosture}`,
    `Open questions: ${issue.openGapsCount} on the issue record · ${openG.length} open in tracker`,
    cleanText(issue.ownerName ?? "") ? `Issue owner: ${issue.ownerName}` : "Issue owner: not recorded yet.",
  ].join("\n");

  const keyUnknownsLeadership = (() => {
    if (!cleanText(openQuestions) && openG.length === 0) {
      return "No open questions are recorded yet.";
    }
    const summary = topOpenQuestions ? capBulletBlock(topOpenQuestions, 6) : "";
    const note =
      openG.length > 6 || splitIntakeOpenQuestions(openQuestions).length > 6
        ? "See the Open questions view for the full register."
        : "";
    return [summary, note].filter(Boolean).join("\n\n");
  })();

  const confirmedFactsBlockExecutive = (() => {
    if (cleanText(confirmedFacts)) {
      return confirmedBlock;
    }
    if (internalInputs.length) {
      return "No confirmed facts are recorded for this version.\n\nInternal notes below are helpful context, but they are not a substitute for confirmed facts. Treat them as provisional until separately validated.";
    }
    return "No confirmed facts are recorded in intake yet.";
  })();

  const audienceBlock = formatAudienceImplications(issue.audience, issueStakeholders, CAP_EX_AUDIENCE, {
    issueAudienceInBriefHeader: true,
  });
  const audienceBlockLeadership = formatAudienceImplications(issue.audience, issueStakeholders, CAP_EX_AUDIENCE, {
    issueAudienceInBriefHeader: true,
    leadershipVoice: true,
  });

  const executiveBlocks: { label: string; body: string }[] = isExecutive
    ? [
        { label: "Situation", body: situationBodyLeadership },
        { label: "Current assessment", body: currentAssessmentLeadership },
        { label: "Confirmed facts", body: confirmedFactsBlockExecutive },
        { label: "Open questions and unresolved needs", body: keyUnknownsLeadership },
        { label: "Evidence base", body: evidenceBaseLeadership(sources, sources.length) },
        {
          label: "Observations",
          body:
            formatObsForExecutive(internalInputsForBrief, CAP_EX_OBS, { leadership: true }) +
            (excludedObsCount ? `\n\n${excludedObsCount} observation(s) are excluded from brief output.` : ""),
        },
        { label: "Audience implications", body: audienceBlockLeadership },
        { label: "Recommended decisions / next actions", body: recommendedBodyForLeadership },
        { label: "What not to say yet / uncertainty guardrails", body: guardrailsLeadership },
      ]
    : [
        { label: "Situation", body: situationBody },
        { label: "Current assessment", body: currentAssessment },
        { label: "Confirmed facts", body: confirmedBlock },
        { label: "Key unknowns / open questions", body: keyUnknownsCombined },
        { label: "Evidence base", body: evidenceBaseExecutive(sources, sources.length) },
        {
          label: "Observations",
          body:
            formatObsForExecutive(internalInputsForBrief, CAP_EX_OBS) +
            (excludedObsCount ? `\n\n${excludedObsCount} observation(s) are excluded from brief output.` : ""),
        },
        { label: "Audience implications", body: audienceBlock },
        { label: "Recommended decisions / next actions", body: recommendedBodyForFull },
        { label: "What not to say yet / uncertainty guardrails", body: guardrails },
      ];

  const immediateActions = isExecutive
    ? [
        "Confirm the working line still matches the latest issue record before forwarding upward.",
        "If the situation moved materially, update the record and circulate an updated brief.",
        `Clarification load: ${issue.openGapsCount} on the issue and ${openG.length} on the list. If they diverge materially, pause for alignment before wide circulation.`,
        sources.length
          ? "For external or board use, re-read the two most salient sources (by tier and recency) for tension with the working line."
          : "For external or board use, no sources are linked yet; add and review source material first.",
        `Internal notes: ${internalInputs.length} on file. If time is short, scan the most recent 1–2 for conflicts with the working line.`,
      ]
    : [
        "Check that the lede in the header still matches the issue record’s working line after the latest edits (or regenerate the brief if the record moved on).",
        `Open questions: ${issue.openGapsCount} on the issue, ${openG.length} open in the tracker—resolve any mismatch in the Open questions view before a hard send.`,
        sources.length
          ? "If this brief is used for external or board use, re-open the two highest-signal sources (by tier and recency) for conflicts with the lede."
          : "If you plan to use this for external or board use, the evidence register is empty at generation time; add and review sources first.",
        `Observations: ${internalInputs.length} on file; skim the latest 1–2 for contradictions to the lede if time allows.`,
      ];

  const backgroundContextBody = (() => {
    const parts: string[] = [];

    if (context.length) {
      parts.push(capLines(context, 10));
    } else {
      parts.push(
        "Background context is not recorded yet. Add a short paragraph in the issue’s context field to capture prior position, constraints, and what changed.",
      );
    }

    if (summary.length) {
      parts.push(`Current framing:\n${sentence(summary)}`);
    } else if (titleLine.length) {
      parts.push(`Current framing:\n${sentence(titleLine)}`);
    }

    const developments = internalInputsForBrief.slice(0, 2);
    if (developments.length) {
      parts.push(
        `Recent developments (from observations)\n${formatObsForExecutive(developments, 2)}`,
      );
    } else if (sources.length) {
      const top = sources.slice(0, 2).map((s) => `${s.title} (${s.tier})`);
      parts.push(
        `Recent developments (from sources)\n- ${top.join("\n- ")}${sources.length > 2 ? "\n- …see Sources for the full register." : ""}`,
      );
    }

    return parts.filter(Boolean).join("\n\n");
  })();

  const confirmedVsBody = (() => {
    const confirmed = cleanText(confirmedFacts) ? capBulletBlock(confirmedBlock, 8) : confirmedBlock;
    const openSummary = topOpenQuestions ? capBulletBlock(topOpenQuestions, 6) : "";
    const openLine =
      openSummary.length > 0
        ? `Open questions (summary)\n${openSummary}\n\nSee Workspace → Open questions for the full register.`
        : "Open questions (summary)\nNo open questions recorded yet.";
    const note =
      openG.length > 0
        ? `Tracker note: ${openG.length} open question(s) are recorded in the open-questions tracker.`
        : "Tracker note: no open questions are recorded in the tracker.";
    return ["Confirmed facts", confirmed, "", openLine, "", note].join("\n");
  })();

  const narrativeBody = (() => {
    const discipline = [
      "- Anchor claims on confirmed facts and linked sources.",
      "- Separate what is confirmed from what is still open.",
      "- Keep the tone suitable for the recorded audience.",
    ].join("\n");

    const header = context.length ? capLines(context, 8) : "Background context is not recorded yet.";
    const audienceLens = formatAudienceImplications(issue.audience, issueStakeholders, 8, { issueAudienceInBriefHeader: true });

    const obsExcerpt =
      formatObsForExecutive(internalInputsForBrief, 4) +
      (excludedObsCount ? `\n\n${excludedObsCount} observation(s) are excluded from brief output.` : "");

    const sourceLines = sourcesNarrativeFull(sources, sources.length).split(/\r?\n/);
    const sourceSummary = sourceLines.slice(0, 8).join("\n");
    const sourceTail = sourceLines.length > 8 ? "\n…see Sources appendix for the full register." : "";

    return [
      header,
      "",
      "Stakeholder and message posture",
      audienceLens,
      "",
      "Narrative discipline",
      discipline,
      "",
      `Observations (excerpt; ${internalInputs.length} on file)`,
      obsExcerpt,
      "",
      "Evidence (summary)",
      `${sourceSummary}${sourceTail}`,
    ].join("\n");
  })();

  const implicationsBody = (() => {
    if (openG.length && !confirmedFacts.length) {
      return "Implications are not yet fully supportable: confirmed facts are thin and open questions remain. Treat downstream impacts as contingent until evidence and owners catch up.";
    }
    if (openG.length) {
      return "Open questions remain. Leadership should assume downstream impacts and messaging may still move as questions are answered. Revisit when the open-questions register is clear or explicitly accepted as residual risk.";
    }
    return "Implications should be revisited as sources are reviewed and the open-questions register changes. If no open questions remain and facts are current, consider implications in line with the audience notes.";
  })();

  const fullExecutiveSummary = (() => {
    const parts: string[] = [];
    if (titleLine) parts.push(`Issue: ${titleLine}`);
    if (context.length) parts.push(capLines(context, 4));
    parts.push(summary || "No issue summary recorded yet.");
    if (openG.length) parts.push(`Leadership attention: ${openG.length} open question(s) remain.`);
    return parts.filter(Boolean).join("\n\n");
  })();

  const artifact: BriefArtifact = {
    lede,
    metadata: {
      audience: issue.audience ?? null,
      circulation: "Internal",
      lastRevisionLabel: updatedAtLabel,
      openGapsLabel: String(issue.openGapsCount),
    },
    full: {
      sections: [
        {
          id: "executive-summary",
          title: "Executive summary",
          body: fullExecutiveSummary,
          confidence: summary.length ? confidence : "Unclear",
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "chronology",
          title: "Background and context",
          body: backgroundContextBody,
          confidence: "Unclear",
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "confirmed-vs-unclear",
          title: "Confirmed vs unclear",
          body: confirmedVsBody,
          confidence: openQuestions.length || openG.length ? "Unclear" : confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "narrative-map",
          title: "Stakeholder narratives",
          body: narrativeBody,
          confidence: context.length || issueStakeholders.length || internalInputs.length ? "Likely" : confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "implications",
          title: "Implications",
          body: implicationsBody,
          confidence: openG.length && !confirmedFacts.length ? "Unclear" : confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "recommended-actions",
          title: "Recommended actions",
          body: recommendedBodyForFull,
          confidence: "Likely",
          updatedAtLabel,
          evidenceRefs: [],
        },
      ],
    },
    executive: {
      blocks: executiveBlocks,
      immediateActions,
    },
  };

  return artifact;
}
