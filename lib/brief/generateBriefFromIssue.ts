import type { Issue, Source, Gap, InternalInput } from "@prisma/client";

import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";
import {
  isLowInternalInputConfidence,
  rankInternalInputsForIssue,
  rankOpenGapsForIssue,
  rankSourcesForIssue,
} from "@/lib/evidence/rankEvidence";

const CAP_EX_SOURCES = 8;
const MAX_QUESTION_BULLETS = 12;
const MAX_QUESTION_BULLET_CHARS = 220;
const CAP_EX_OPEN_GAPS = 8;
const CAP_EX_OBS = 5;
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

/** Dedupe trimmed names and sort for deterministic brief output (from Messages `MessageVariant.stakeholderGroupId`). */
export function normalizeMessageAudienceGroupNames(names: readonly string[]): string[] {
  const set = new Set<string>();
  for (const n of names) {
    const c = cleanText(n);
    if (c) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
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

/** Deterministic bullets for intake open questions — caps length and count; preserves multiline splits. Exported for fixtures. */
export function splitOpenQuestionsToBullets(text: string): string[] {
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return [];

  let parts = splitIntakeOpenQuestions(t);
  if (
    parts.length === 1 &&
    parts[0].length > 120 &&
    !parts[0].includes("\n") &&
    !parts[0].includes(";") &&
    !parts[0].includes("? ")
  ) {
    const dotBreaks = (parts[0].match(/\.\s+/g) ?? []).length;
    if (dotBreaks >= 2) {
      const raw = parts[0].split(/\.\s+/).map((s) => s.trim()).filter(Boolean);
      if (raw.length >= 2 && raw.length <= 20) {
        parts = raw.map((s) => (/[.!?]$/.test(s) ? s : `${stripTrailingPunctuation(s)}.`));
      }
    }
  }

  const clipped = parts
    .slice(0, MAX_QUESTION_BULLETS)
    .map((p) => clipAtWordBoundary(p.trim(), MAX_QUESTION_BULLET_CHARS))
    .filter(Boolean);
  if (clipped.length) return clipped;
  const fallback = clipAtWordBoundary(t, MAX_QUESTION_BULLET_CHARS);
  return fallback ? [fallback] : [];
}

function intakeOpenQuestionsAsBulletLines(text: string): string {
  const parts = splitOpenQuestionsToBullets(text);
  if (!parts.length) return "";
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
  const intakeItems = splitOpenQuestionsToBullets(openQuestionsRaw)
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

function clipAtWordBoundary(input: string, maxChars: number) {
  const raw = input.trim();
  if (!raw) return "";
  if (raw.length <= maxChars) return raw;
  const slice = raw.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const clipped = (lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trimEnd();
  const cleaned = clipped.replace(/\b(or|and|to|of|for|with|without)\b$/i, "").trimEnd();
  return `${stripTrailingPunctuation(cleaned)}…`;
}

function normalizeQuestionThemeKey(input: string) {
  const s = normalizeNeedText(input);
  if (!s) return "";
  if (/\bfollow[- ]?up\b|\bcadence\b|\bnext meeting\b|\bwritten note\b|\bnamed owner\b|\bowner\b.*\bcadence\b/i.test(s)) {
    return "theme:follow-up-cadence-owner";
  }
  if (/\bproof point\b|\bproofpoints\b|\bevidence\b|\bcite\b|\bsources?\b|\bwhat can remain internal\b/i.test(s)) {
    return "theme:proof-points-evidence";
  }
  if (/\bpartnership\b|\boffers?\b|\bcommit(?:ment|ting)\b|\bprocurement\b|\bbudget\b/i.test(s)) {
    return "theme:partnership-offers-commitments";
  }
  if (/\btimeline\b|\bwhen\b|\bdates?\b|\bdecision point\b|\bsign[- ]?off\b|\blaunch\b|\bclose\b/i.test(s)) {
    return "theme:timeline-decision";
  }
  if (/\baccessib/i.test(s) || /\blanguage(s)?\b|\bformats?\b|\bassisted\b/i.test(s)) {
    return "theme:accessibility-support";
  }
  return "";
}

function normalizeQuestionKey(input: string) {
  const base = normalizeNeedText(input);
  if (!base) return "";
  return base
    .replace(
      /\b(the|a|an|to|of|for|and|or|will|be|are|is|was|were|should|could|would|can|do|does|did|what|which|who|when|where|why|how)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function fixMalformedQuestionText(input: string) {
  const raw = input.trim();
  if (!raw) return "";
  const withoutLead = raw.replace(/^[-•*]+\s+/u, "").replace(/^\d+\s*[\).]\s+/u, "").trim();

  const openParens = (withoutLead.match(/\(/g) ?? []).length;
  const closeParens = (withoutLead.match(/\)/g) ?? []).length;
  const parenFixed = openParens > closeParens ? `${withoutLead})` : withoutLead;

  const base = stripTrailingPunctuation(parenFixed);
  const startsLikeQuestion = /^(what|which|who|when|where|why|how|can|should|is|are|do|does|will)\b/i.test(base);
  const endsWithTerminal = /[?!.]$/u.test(parenFixed.trim());
  if (endsWithTerminal) return parenFixed.trim();
  if (!startsLikeQuestion) return base;
  return `${base}?`;
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
  cap = 5,
}: {
  openQuestionsRaw: string;
  openGaps: Gap[];
  cap?: number;
}) {
  const intakeItems = splitOpenQuestionsToBullets(openQuestionsRaw).map((s) => fixMalformedQuestionText(s)).filter(Boolean);

  const byKey = new Map<
    string,
    { source: "intake" | "gap"; score: number; text: string; severity?: string | null; section?: string | null }
  >();

  for (const item of intakeItems) {
    const key = normalizeQuestionThemeKey(item) || normalizeQuestionKey(item) || normalizeNeedText(item);
    if (!key) continue;
    const existing = byKey.get(key);
    const candidate = { source: "intake" as const, score: 0, text: item, severity: null, section: null };
    if (!existing || candidate.score > existing.score || (candidate.score === existing.score && candidate.text.length < existing.text.length)) {
      byKey.set(key, candidate);
    }
  }

  /** Expect `openGaps` in deterministic rank order (severity, recency, id) from `rankOpenGapsForIssue`. */
  for (const g of openGaps) {
    const raw = fixMalformedQuestionText((g.prompt || g.title || "").trim());
    if (!raw) continue;
    const key = normalizeQuestionThemeKey(raw) || normalizeQuestionKey(raw) || normalizeNeedText(raw);
    if (!key) continue;
    const hasSeverity = Boolean(g.severity);
    const linkedSection = cleanText((g as any).linkedSection) ? String((g as any).linkedSection) : null;
    const score = (hasSeverity ? 2 : 0) + (linkedSection ? 1 : 0);
    const existing = byKey.get(key);
    const candidate = { source: "gap" as const, score, text: raw, severity: g.severity ?? null, section: linkedSection };
    if (!existing) {
      byKey.set(key, candidate);
      continue;
    }
    const prefer = candidate.score > existing.score || (candidate.score === existing.score && candidate.text.length < existing.text.length);
    if (prefer) byKey.set(key, candidate);
  }

  const ranked = [...byKey.values()].sort((a, b) => {
    if (a.source !== b.source) return a.source === "gap" ? -1 : 1;
    if (a.score !== b.score) return b.score - a.score;
    return a.text.length - b.text.length;
  });

  const out = ranked.slice(0, cap).map((q) => {
    const sev = q.source === "gap" && q.severity ? `[${q.severity}] ` : "";
    const section = q.source === "gap" && q.section ? ` — ${q.section}` : "";
    return `- ${sev}${stripTrailingPunctuation(q.text)}${section}`;
  });

  return out.join("\n");
}

export type BriefGenerationInput = {
  issue: Issue;
  sources: Source[];
  gaps: Gap[];
  internalInputs: InternalInput[];
  /**
   * Distinct organisation audience group names inferred from Messages (`MessageVariant` rows with `stakeholderGroupId`).
   */
  messageAudienceGroupNames?: string[];
};

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
  /** Inputs are expected in `rankInternalInputsForIssue` order. */
  const sorted = inputs;
  const preferred = sorted.filter((i) => !isLowInternalInputConfidence(i.confidence));
  const shown = (preferred.length ? preferred : sorted).slice(0, cap);

  const preface = leadership
    ? "Internal notes are team-sourced and may be incomplete; treat them as context, not as confirmed facts."
    : "";

  const lines = shown.map((i) => {
    const response = i.response.slice(0, 200);
    const clipped = i.response.length > 200 ? "…" : "";
    return `• ${i.role} · ${i.name}: ${response}${clipped}`;
  });

  const lowCount = inputs.filter((i) => isLowInternalInputConfidence(i.confidence)).length;
  const lowShownCount = shown.filter((i) => isLowInternalInputConfidence(i.confidence)).length;
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
  /** Inputs are expected in `rankInternalInputsForIssue` order. */
  const sorted = inputs;
  const preferred = sorted.filter((i) => !isLowInternalInputConfidence(i.confidence));
  const shown = (preferred.length ? preferred : sorted).slice(0, cap);

  const lines = shown.map((i) => {
    const section = i.linkedSection ? `Section: ${i.linkedSection} · ` : "";
    return `- ${i.role} · ${i.name} · ${i.confidence}\n  ${section}${i.response}`;
  });

  const lowCount = inputs.filter((i) => isLowInternalInputConfidence(i.confidence)).length;
  const lowShownCount = shown.filter((i) => isLowInternalInputConfidence(i.confidence)).length;
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

function dedupeActionLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const n = normalizeNeedText(line);
    const key = n.slice(0, 96);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

function formatAudienceImplications(issueAudience: string | null, messageAudienceGroupNames: string[]) {
  const fromIssue = cleanText(issueAudience ?? "");
  const groupNames = normalizeMessageAudienceGroupNames(messageAudienceGroupNames);

  if (groupNames.length && fromIssue) {
    return `Audience groups used in Messages: ${groupNames.join(", ")}.\n\nIssue-level audience note (intake): ${fromIssue}`;
  }
  if (groupNames.length) {
    return `Audience groups used in Messages: ${groupNames.join(", ")}. No intake audience note is recorded — add one in intake if framing should go beyond those groups.`;
  }
  if (fromIssue) {
    return `Issue-level audience note (intake): ${fromIssue}`;
  }
  return "No organisation audience groups appear in saved Messages for this issue yet, and no intake audience note is recorded. Use Messages for audience-specific drafts when needed, or add an intake audience note.";
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

/** Not referenced by current brief artifact; if wired in, pass `rankSourcesForIssue` output and `total`. */
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
  const { issue, sources, gaps, internalInputs, messageAudienceGroupNames = [] } = input;
  const orderedMessageAudienceNames = normalizeMessageAudienceGroupNames(messageAudienceGroupNames);
  const isExecutive = mode === "executive";
  const updatedAtLabel = nowLabel();
  const confidence = confidenceFromStatus(issue.status);
  const excludedObsCount = internalInputs.filter((i: any) => Boolean((i as any).excludedFromBrief)).length;
  const rankedSources = rankSourcesForIssue(sources);
  const rankedOpenGaps = rankOpenGapsForIssue(gaps, { onlyOpen: true });
  const rankedInternalForBrief = rankInternalInputsForIssue(internalInputs, { excludeFromBrief: true });
  /** Intentionally raw / not re-ranked: `issue.openGapsCount` (artifact label), `confirmedFactsBlockExecutive` checks `internalInputs.length` (includes excluded), `sourcesNarrativeFull` (dead helper). */

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

  const topOpenQuestions = topOpenQuestionsSummary({ openQuestionsRaw: openQuestions, openGaps: rankedOpenGaps, cap: 5 });
  const keyUnknownsCombined = (() => {
    const a = cleanText(unknownsFromIntake) ? `From intake (open questions)\n${capLines(unknownsFromIntake, 14)}` : "";
    const withSection = rankedOpenGaps.filter((g) => cleanText((g as any).linkedSection));
    const unassignedAll = rankedOpenGaps.filter((g) => !cleanText((g as any).linkedSection));
    const { kept: unassigned, allWereDuplicates } = dedupeUnassignedNeedsAgainstIntake(openQuestions, unassignedAll);
    const b = rankedOpenGaps.length
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
    const actionFromQuestion = (qRaw: string) => {
      const q = fixMalformedQuestionText(qRaw);
      const t = normalizeNeedText(q);
      if (!t) return "";
      if (/\bfollow[- ]?up\b|\bcadence\b|\bnamed owner\b/i.test(q)) return "Confirm follow-up cadence and named owner before any leadership or stakeholder meeting.";
      if (/\bproof point\b|\bevidence\b|\bcite\b|\bsources?\b/i.test(q)) return "Agree which proof points can be cited and which require softer wording or follow-up.";
      if (/\bpartnership\b|\boffers?\b|\bprocurement\b|\bbudget\b|\bcommit(?:ment|ting)\b/i.test(q))
        return "Clarify any partnership offers and constraints before they are mentioned externally.";
      if (/\btimeline\b|\bwhen\b|\bdates?\b|\bdecision point\b|\bsign[- ]?off\b/i.test(q))
        return "Confirm timeline, decision points, and sign-off milestones for the next update.";
      if (/\bstakeholder\b|\bsector\b|\bcommunity\b|\bconcerns?\b/i.test(q))
        return "Align expected stakeholder concerns and who will support detail on the day.";
      const short = clipAtWordBoundary(stripTrailingPunctuation(q), 92);
      return short ? `Confirm the current position on: ${short}` : "";
    };

    const candidates = [
      ...splitIntakeOpenQuestions(openQuestions),
      ...rankedOpenGaps.map((g) => (g.prompt || g.title || "").trim()),
    ].filter(Boolean);
    const seen = new Set<string>();
    for (const c of candidates) {
      const key = normalizeQuestionThemeKey(c) || normalizeQuestionKey(c) || normalizeNeedText(c);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const a = actionFromQuestion(c);
      if (a) out.push(a);
      if (out.length >= 2) break;
    }

    if (rankedSources.length) {
      const top = rankedSources.slice(0, 2).map((s) => `${s.title} (${s.tier})`);
      out.push(
        `Cite the evidence base (${rankedSources.length} on file), starting with: ${top.join("; ")}${rankedSources.length > 2 ? " …" : "."}`,
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
    const oqBullets = splitOpenQuestionsToBullets(openQuestions);
    const hasGaps = rankedOpenGaps.length > 0;
    const hasOq = oqBullets.length > 0;

    if (hasGaps) {
      for (const g of rankedOpenGaps.slice(0, 4)) {
        const raw = (g.prompt.trim() || g.title).replace(/\s+/g, " ");
        const prompt = clipAtWordBoundary(stripTrailingPunctuation(raw), 110);
        if (!prompt) continue;
        const sev = g.severity ? `[${g.severity}] ` : "";
        const sec = cleanText(g.linkedSection ?? "");
        const secBit = sec ? ` (${sec})` : "";
        out.push(`Assign owner and resolution path for ${sev}open question${secBit}: ${prompt}.`);
      }
    } else if (hasOq) {
      const seen = new Set<string>();
      for (const c of oqBullets) {
        const q = fixMalformedQuestionText(c);
        if (!q) continue;
        const key = normalizeQuestionThemeKey(q) || normalizeQuestionKey(q) || normalizeNeedText(q);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        if (/\bfollow[- ]?up\b|\bcadence\b|\bnamed owner\b/i.test(q)) {
          out.push("Confirm follow-up cadence and named owner before the leadership session.");
        } else if (/\bproof point\b|\bevidence\b|\bcite\b|\bsources?\b/i.test(q)) {
          out.push("Agree which proof points can be used in the room and which require softer wording or follow-up.");
        } else if (/\bpartnership\b|\boffers?\b|\bprocurement\b|\bbudget\b|\bcommit(?:ment|ting)\b/i.test(q)) {
          out.push("Clarify any partnership offers and constraints before they are mentioned externally.");
        } else if (/\btimeline\b|\bwhen\b|\bdates?\b|\bdecision point\b|\bsign[- ]?off\b/i.test(q)) {
          out.push("Confirm timeline and decision points, including what can be said publicly vs internally.");
        } else {
          const short = clipAtWordBoundary(stripTrailingPunctuation(q), 86);
          if (short) out.push(`Resolve the open question: ${short}`);
        }
        if (out.length >= 2) break;
      }
    }

    if (rankedSources.length) {
      const counts = new Map<string, number>();
      for (const s of rankedSources) {
        const k = cleanText(s.tier) || "Unset";
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      const mix = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k}×${v}`)
        .join(", ");
      const official = counts.get("Official") ?? 0;
      let tail = "";
      if (official === 0) tail = " No Official-tier material on file — keep external claims conditional.";
      else if (rankedSources.length === 1) tail = " Single source on file — cross-check before hard commitments.";
      out.push(`Cite the evidence base (${rankedSources.length} on file; tier mix: ${mix}).${tail}`);
    } else if (hasGaps || hasOq) {
      out.push("Link at least one source so leadership lines can be traced to attributable material.");
    }

    if (orderedMessageAudienceNames.length) {
      out.push(
        sentence(`Stress-test external-facing lines for audience groups used in Messages: ${orderedMessageAudienceNames.join(", ")}`),
      );
    } else if (cleanText(issue.audience ?? "")) {
      out.push(sentence(`Calibrate the line against the intake audience note: ${cleanText(issue.audience ?? "")}`));
    }

    if (cleanText(issue.ownerName ?? "")) {
      out.push(`Accountable owner for the next update and sign-off: ${issue.ownerName}.`);
    } else {
      out.push("Assign a named owner for the next update and sign-off.");
    }

    let deduped = dedupeActionLines(out);
    const thin = !hasGaps && !hasOq;
    if (thin && deduped.length < 2) {
      deduped = dedupeActionLines([
        ...deduped,
        "Confirm what remains under validation before broad or external circulation.",
      ]);
    }
    return deduped.slice(0, 5);
  })();

  const recommendedBodyForLeadership = recommendedActionsForLeadership.map((x, i) => `${i + 1}) ${x}`).join("\n");

  const guardrails = [
    "Do not state causes, scope, or impact that are not supported by confirmed facts, linked sources, or attributable observations.",
    rankedOpenGaps.length
      ? `There are ${rankedOpenGaps.length} open question(s) in the tracker; treat them as open until answered with attributable input.`
      : "If new unknowns appear, record them as open questions before treating them as settled.",
    "Avoid speculative or escalatory language; align any external line with the recorded audience notes and validation posture.",
  ].join("\n\n");

  const guardrailsLeadership = [
    "Do not state causes, scope, or impact that are not supported by confirmed facts, linked sources, or attributable observations.",
    rankedOpenGaps.length
      ? `There are ${rankedOpenGaps.length} open question(s) on the list; treat them as open until attributable input or confirmed intake updates answer them.`
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
    const hasOq = rankedOpenGaps.length > 0 || splitOpenQuestionsToBullets(openQuestions).length > 0;
    const whyItMatters = (() => {
      const text = [titleLine, summary, context, String(issue.audience ?? "")].join("\n").toLowerCase();
      if (text.includes("roundtable")) {
        return "Why it matters: leadership-facing relationship management; avoid over-claiming and ensure follow-ups are owned.";
      }
      if (text.includes("consultation")) {
        return "Why it matters: credibility and process integrity; keep language aligned to what is genuinely open vs fixed constraints.";
      }
      if (text.includes("criticism") || text.includes("critic")) {
        return "Why it matters: stakeholder trust and reputational sensitivity; keep tone calm, evidence-led, and process-focused.";
      }
      if (String(issue.priority).toLowerCase().includes("high") || String(issue.severity).toLowerCase().includes("high")) {
        return "Why it matters: leadership attention is likely required; keep claims tied to confirmed facts and sources.";
      }
      return "Why it matters: keep the leadership line disciplined, evidence-tied, and explicit about what remains open.";
    })();

    const leadershipNotes = (() => {
      const notes: string[] = [];
      if (hasOq) notes.push(`Open questions remain (${rankedOpenGaps.length} on the tracker). Treat details as provisional where not yet confirmed.`);
      if (!rankedSources.length) notes.push("Evidence base is thin (no linked sources yet). Avoid specific claims until evidence is on file.");
      if (cleanText(issue.ownerName ?? "")) notes.push(`Named owner: ${issue.ownerName}.`);
      return notes.join(" ");
    })();

    const contextBlock = context.length
      ? capLines(sanitizeBriefUserText(context), 8)
      : "Supplemental context is not recorded on the issue. The working line is in the brief header above.";

    return [contextBlock, whyItMatters, leadershipNotes].filter(Boolean).join("\n\n");
  })();

  const currentAssessment = [
    `Status: ${issue.status}`,
    `Severity: ${issue.severity}`,
    `Urgency: ${issue.priority}`,
    `Briefing posture: ${issue.operatorPosture}`,
    `Open questions: ${issue.openGapsCount} (tracker: ${rankedOpenGaps.length} open)`,
    cleanText(issue.ownerName ?? "") ? `Issue owner: ${issue.ownerName}` : "Issue owner: not recorded yet.",
  ].join("\n");

  const currentAssessmentLeadership = [
    `Status: ${issue.status}`,
    `Severity: ${issue.severity}`,
    `Urgency: ${issue.priority}`,
    `Briefing posture: ${issue.operatorPosture}`,
    `Open questions: ${issue.openGapsCount} on the issue record · ${rankedOpenGaps.length} open in tracker`,
    cleanText(issue.ownerName ?? "") ? `Issue owner: ${issue.ownerName}` : "Issue owner: not recorded yet.",
  ].join("\n");

  const keyUnknownsLeadership = (() => {
    if (!cleanText(openQuestions) && rankedOpenGaps.length === 0) {
      return "No open questions are recorded yet.";
    }
    const summary = topOpenQuestions ? capBulletBlock(topOpenQuestions, 5) : "";
    const note =
      rankedOpenGaps.length > 5 || splitOpenQuestionsToBullets(openQuestions).length > 5
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

  const audienceBlock = formatAudienceImplications(issue.audience, messageAudienceGroupNames);

  const executiveBlocks: { label: string; body: string }[] = isExecutive
    ? [
        { label: "Executive summary", body: situationBodyLeadership },
        { label: "Current assessment", body: currentAssessmentLeadership },
        { label: "Confirmed facts", body: confirmedFactsBlockExecutive },
        { label: "Open questions and unresolved needs", body: keyUnknownsLeadership },
        { label: "Evidence base", body: evidenceBaseLeadership(rankedSources, rankedSources.length) },
        {
          label: "Observations",
          body:
            formatObsForExecutive(rankedInternalForBrief, CAP_EX_OBS, { leadership: true }) +
            (excludedObsCount ? `\n\n${excludedObsCount} observation(s) are excluded from brief output.` : ""),
        },
        { label: "Audience implications", body: audienceBlock },
        { label: "Recommended decisions / next actions", body: recommendedBodyForLeadership },
        { label: "What not to say yet / uncertainty guardrails", body: guardrailsLeadership },
      ]
    : [
        { label: "Situation", body: situationBody },
        { label: "Current assessment", body: currentAssessment },
        { label: "Confirmed facts", body: confirmedBlock },
        { label: "Key unknowns / open questions", body: keyUnknownsCombined },
        { label: "Evidence base", body: evidenceBaseExecutive(rankedSources, rankedSources.length) },
        {
          label: "Observations",
          body:
            formatObsForExecutive(rankedInternalForBrief, CAP_EX_OBS) +
            (excludedObsCount ? `\n\n${excludedObsCount} observation(s) are excluded from brief output.` : ""),
        },
        { label: "Audience implications", body: audienceBlock },
        { label: "Recommended decisions / next actions", body: recommendedBodyForFull },
        { label: "What not to say yet / uncertainty guardrails", body: guardrails },
      ];

  const immediateActions: string[] = [];

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

    const developments = rankedInternalForBrief.slice(0, 2);
    if (developments.length) {
      parts.push(
        `Recent developments (from observations)\n${formatObsForExecutive(developments, 2)}`,
      );
    } else if (rankedSources.length) {
      const top = rankedSources.slice(0, 2).map((s) => `${s.title} (${s.tier})`);
      parts.push(
        `Recent developments (from sources)\n- ${top.join("\n- ")}${rankedSources.length > 2 ? "\n- …see Sources for the full register." : ""}`,
      );
    }

    return parts.filter(Boolean).join("\n\n");
  })();

  const confirmedVsBody = (() => {
    const confirmed = cleanText(confirmedFacts) ? capBulletBlock(confirmedBlock, 8) : confirmedBlock;
    const openSummary = topOpenQuestions ? capBulletBlock(topOpenQuestions, 5) : "";
    const openLine =
      openSummary.length > 0
        ? `Open questions (summary)\n${openSummary}\n\nSee Workspace → Open questions for the full register.`
        : "Open questions (summary)\nNo open questions recorded yet.";
    const note =
      rankedOpenGaps.length > 0
        ? `Tracker note: ${rankedOpenGaps.length} open question(s) are recorded in the open-questions tracker.`
        : "Tracker note: no open questions are recorded in the tracker.";
    return ["Confirmed facts", confirmed, "", openLine, "", note].join("\n");
  })();

  const narrativeBody = (() => {
    const audienceTextRaw = cleanText(issue.audience ?? "");
    const lensBullets =
      audienceTextRaw.length === 0
        ? []
        : bulletsFromMultiline(capLines(audienceTextRaw, 12))
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.startsWith("-"))
            .slice(0, 3);

    const shortIntro = audienceTextRaw.length
      ? "This section highlights messaging sensitivities for the intake audience note recorded on this issue."
      : "No specific audience note is recorded on the issue.";

    const obsLines = formatObsForExecutive(rankedInternalForBrief, 2).split(/\r?\n/).filter((l) => l.trim().startsWith("•")).slice(0, 2);
    const obsBlock = obsLines.length ? obsLines.join("\n") : "No observation excerpts available.";

    const sourceRefs = rankedSources
      .slice(0, 2)
      .map((s) => `- ${s.sourceCode} — ${s.title} (${s.tier})`);
    const evidenceBlock = sourceRefs.length ? sourceRefs.join("\n") : "";

    const stakeholderImplicationsBlock =
      lensBullets.length > 0
        ? ["Stakeholder implications", ...lensBullets].join("\n")
        : "Stakeholder implications\n- No specific audience note is recorded on the issue.";

    return [
      sentence(shortIntro),
      "",
      stakeholderImplicationsBlock,
      "",
      "Observation excerpts",
      obsBlock,
      ...(evidenceBlock ? ["", "Evidence references (if cited)", evidenceBlock] : []),
    ].join("\n");
  })();

  const implicationsBody = (() => {
    const text = [titleLine, summary, context, openQuestions, String(issue.audience ?? "")].join("\n").toLowerCase();
    const risks: string[] = [];
    if (rankedOpenGaps.length || cleanText(openQuestions)) {
      risks.push("Risk of over-claiming while open questions remain; keep language explicitly conditional where needed.");
    }
    if (text.includes("consultation")) {
      risks.push("Consultation integrity and process clarity: distinguish what is fixed constraints vs what is genuinely open to input.");
    }
    if (text.includes("accessib")) {
      risks.push("Accessibility and inclusion: ensure participation options and support are clear, especially for stakeholder-facing lines.");
    }
    if (/\bfollow[- ]?up\b|\bcadence\b|\bnamed owner\b/i.test(text)) {
      risks.push("Follow-up commitments: avoid promising timelines or actions without a named owner and agreed cadence.");
    }
    if (!rankedSources.length) {
      risks.push("Evidence thin: avoid specific claims until at least one attributable source is linked and reviewed.");
    }
    if (!risks.length) {
      risks.push("Keep sensitive points aligned to the recorded audience notes; separate confirmed facts from what is still open.");
    }
    return risks.slice(0, 4).map((r) => `- ${sentence(r)}`).join("\n");
  })();

  const fullExecutiveSummary = (() => {
    const parts: string[] = [];
    if (titleLine) parts.push(`Issue: ${titleLine}`);
    parts.push(summary ? sentence(summary) : "No issue summary recorded yet.");
    if (rankedOpenGaps.length) parts.push(`Leadership attention: ${rankedOpenGaps.length} open question(s) remain.`);
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
          title: "Current position and open questions",
          body: confirmedVsBody,
          confidence: openQuestions.length || rankedOpenGaps.length ? "Unclear" : confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "narrative-map",
          title: "Stakeholder narratives",
          body: narrativeBody,
          confidence:
            context.length || cleanText(issue.audience ?? "").length || internalInputs.length ? "Likely" : confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "implications",
          title: "Risks and sensitivities",
          body: implicationsBody,
          confidence: rankedOpenGaps.length && !confirmedFacts.length ? "Unclear" : confidence,
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
