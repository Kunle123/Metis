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

/** Terminal sentence punctuation only — do not strip `)`/`]` so parentheticals stay balanced (e.g. “Messages (A, B).”). */
function stripTrailingSentencePunctuationOnly(s: string) {
  return s.replace(/[.。…!?]+$/u, "").trimEnd();
}

function sentence(s: string) {
  const t = s.trim();
  if (!t) return "";
  return `${stripTrailingSentencePunctuationOnly(t)}.`;
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

/** Drops trailing substring that leaves `(`/`[` depth unclosed so Executive lines do not end on `(budget/planning/safety`. */
function truncateBeforeUnbalancedOpens(fragment: string, openChar: "(" | "[", closeChar: ")" | "]"): string {
  let depth = 0;
  for (let i = fragment.length - 1; i >= 0; i--) {
    const c = fragment[i];
    if (c === closeChar) depth++;
    else if (c === openChar) {
      if (depth === 0) {
        const out = fragment.slice(0, i).trimEnd();
        return out.length ? `${stripTrailingPunctuation(out)}…` : "…";
      }
      depth--;
    }
  }
  return fragment;
}

function sanitizeClippedFragment(fragment: string): string {
  let s = fragment.trim();
  if (!s) return s;
  let open = (s.match(/\(/g) ?? []).length;
  let close = (s.match(/\)/g) ?? []).length;
  if (open > close) s = truncateBeforeUnbalancedOpens(s, "(", ")");
  open = (s.match(/\[/g) ?? []).length;
  close = (s.match(/\]/g) ?? []).length;
  if (open > close) s = truncateBeforeUnbalancedOpens(s, "[", "]");
  return s.trim();
}

/**
 * Clips at a word boundary, balances obvious cut-off brackets/parentheses, and ends on an ellipsis when truncated.
 * Use for Executive open-question excerpts and decision scaffolds (not Full brief rows).
 */
export function trimForExecutiveClause(raw: string, maxChars: number): string {
  const oneLine = raw.trim().replace(/\s+/g, " ");
  if (!oneLine) return "";
  if (oneLine.length <= maxChars) {
    return sanitizeClippedFragment(oneLine);
  }
  let s = clipAtWordBoundary(oneLine, maxChars);
  s = sanitizeClippedFragment(s);
  if (!/[.!?…]$/u.test(s)) s = `${stripTrailingPunctuation(s)}…`;
  return s;
}

const ENGLISH_NUMBERS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
] as const;

function numberToEnglish(n: number): string {
  if (n >= 0 && n < ENGLISH_NUMBERS.length) return ENGLISH_NUMBERS[n]!;
  return String(n);
}

/** Count word at sentence start after a period (e.g. “Two linked records…”). */
function englishNumberCapitalizedForSentenceStart(n: number): string {
  const w = numberToEnglish(n);
  return w.length ? `${w.slice(0, 1).toUpperCase()}${w.slice(1)}` : w;
}

function bundleIssueText(issue: Pick<Issue, "title" | "summary" | "context">): string {
  return [cleanText(issue.title), cleanText(issue.summary), cleanText(issue.context ?? "")].filter(Boolean).join(" ");
}

function issueSignalsConsultation(bundleLower: string): boolean {
  return /\bconsultation|redevelopment|stakeholder|community engagement|regeneration|planning application|scheme\b/i.test(bundleLower);
}

function issueSignalsLegalOrNoticePolicy(bundleLower: string): boolean {
  return /\b(legal|solicitor|counsel|regulator|compliance|gdpr|notice policy|statutory notice)\b/i.test(bundleLower);
}

/** Gap text suggests legal/customer notice checks that may be off-theme for consultation-led issues. */
function gapTextSuggestsLegalOrCustomerNotice(t: string): boolean {
  return /\b(customer notices?|resident notices?|notice obligations?|legal (has |)(confirmed|cleared|signed)|whether .* notices? (are )?required)\b/i.test(t);
}

function gapSuggestsMaterialChangeConsultation(t: string): boolean {
  return /\bmaterial[- ]?change|\bthreshold\b.*\bchange\b|\bchange\b.*\bthreshold\b/i.test(t);
}

function gapSuggestsOpenVsFixedConsultation(t: string): boolean {
  return /\bopen (vs\.?|versus) fixed|fixed (vs\.?|versus) open|what (is|are) fixed|fixed constraints?\b/i.test(t);
}

function gapSuggestsConsultationAccess(t: string): boolean {
  return /\baccess (steps|package|route|options)|easy read|assisted|interpretation|language support|participation support\b/i.test(t);
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

type TopOpenQuestionRecord = {
  source: "intake" | "gap";
  score: number;
  text: string;
  severity?: string | null;
  section?: string | null;
};

function severityRankForOpenQuestion(severity: string | null | undefined): number {
  const u = cleanText(severity ?? "").toLowerCase();
  if (u.includes("critical")) return 4;
  if (u.includes("blocker")) return 4;
  if (u.includes("severe") || u.includes("serious")) return 3;
  if (u.includes("high")) return 3;
  if (u.includes("important")) return 2;
  if (u.includes("moderate") || u.includes("medium")) return 1;
  if (u.length) return 1;
  return 0;
}

function gatherTopOpenQuestionRecords(openQuestionsRaw: string, openGaps: Gap[]): TopOpenQuestionRecord[] {
  const intakeItems = splitOpenQuestionsToBullets(openQuestionsRaw).map((s) => fixMalformedQuestionText(s)).filter(Boolean);

  const byKey = new Map<string, TopOpenQuestionRecord>();

  for (const item of intakeItems) {
    const key = normalizeQuestionThemeKey(item) || normalizeQuestionKey(item) || normalizeNeedText(item);
    if (!key) continue;
    const existing = byKey.get(key);
    const candidate: TopOpenQuestionRecord = { source: "intake", score: 0, text: item, severity: null, section: null };
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
    const candidate: TopOpenQuestionRecord = { source: "gap", score, text: raw, severity: g.severity ?? null, section: linkedSection };
    if (!existing) {
      byKey.set(key, candidate);
      continue;
    }
    const prefer =
      candidate.score > existing.score || (candidate.score === existing.score && candidate.text.length < existing.text.length);
    if (prefer) byKey.set(key, candidate);
  }

  /** Same ordering as legacy `topOpenQuestionsSummary`: gap precedence, tracker score tie-breakers, shorter text first. Full brief depends on this. */
  const ranked = [...byKey.values()].sort((a, b) => {
    if (a.source !== b.source) return a.source === "gap" ? -1 : 1;
    if (a.score !== b.score) return b.score - a.score;
    return a.text.length - b.text.length;
  });

  return ranked;
}

const NEAR_DUP_STOPWORDS = new Set([
  "what",
  "which",
  "when",
  "where",
  "whose",
  "whether",
  "that",
  "this",
  "with",
  "from",
  "into",
  "about",
  "have",
  "been",
  "there",
  "their",
  "they",
  "needs",
  "need",
]);

function significantTokensForNearDup(normalizedSentence: string): Set<string> {
  const tokens = normalizedSentence.split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (const raw of tokens) {
    const t = stripTrailingPunctuation(raw);
    if (t.length < 4 || NEAR_DUP_STOPWORDS.has(t)) continue;
    out.add(t);
  }
  return out;
}

function tokenJaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1;
  if (!a.size || !b.size) return 0;
  let inter = 0;
  const smaller = a.size <= b.size ? a : b;
  const larger = a.size <= b.size ? b : a;
  for (const x of smaller) if (larger.has(x)) inter += 1;
  const uni = a.size + b.size - inter;
  return uni ? inter / uni : 0;
}

/** Executive-only: merges near-duplicates that survived key-level dedupe; conservative thresholds. */
export function dedupeExecutiveNearDuplicateQuestions(items: readonly TopOpenQuestionRecord[]): TopOpenQuestionRecord[] {
  const out: TopOpenQuestionRecord[] = [];
  const pickPreferred = (x: TopOpenQuestionRecord, y: TopOpenQuestionRecord): TopOpenQuestionRecord => {
    const sr = severityRankForOpenQuestion(y.severity) - severityRankForOpenQuestion(x.severity);
    if (sr !== 0) return sr > 0 ? y : x;
    if (x.source !== y.source) return x.source === "gap" ? x : y;
    if (x.score !== y.score) return x.score >= y.score ? x : y;
    return x.text.length <= y.text.length ? x : y;
  };

  const stripLeadSeverity = (s: string) => s.replace(/^\[[^\]]+\]\s*/, "").trim();

  const nearDuplicateTexts = (a: string, b: string): boolean => {
    const norm = (raw: string) => normalizeNeedText(stripLeadSeverity(raw)).replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
    const na = norm(a);
    const nb = norm(b);
    if (!na || !nb) return na === nb;
    if (na === nb) return true;
    const shorter = na.length <= nb.length ? na : nb;
    const longer = na.length <= nb.length ? nb : na;
    if (shorter.length >= 28 && longer.includes(shorter) && shorter.length >= longer.length * 0.82) return true;

    const ja = significantTokensForNearDup(na);
    const jb = significantTokensForNearDup(nb);
    const j = tokenJaccard(ja, jb);
    const minTok = Math.min(ja.size, jb.size);
    if (minTok >= 2 && j >= 0.82) return true;
    if (minTok >= 3 && j >= 0.68) return true;
    return false;
  };

  for (const item of items) {
    let merged = false;
    for (let i = 0; i < out.length; i += 1) {
      if (nearDuplicateTexts(item.text, out[i].text)) {
        out[i] = pickPreferred(out[i], item);
        merged = true;
        break;
      }
    }
    if (!merged) out.push(item);
  }

  const bySevGapScore = [...out].sort((a, b) => {
    const sr = severityRankForOpenQuestion(b.severity) - severityRankForOpenQuestion(a.severity);
    if (sr !== 0) return sr;
    if (a.source !== b.source) return a.source === "gap" ? -1 : 1;
    if (a.score !== b.score) return b.score - a.score;
    return a.text.localeCompare(b.text, undefined, { sensitivity: "base" });
  });
  return bySevGapScore;
}

function formatTopOpenQuestionsBody(records: readonly TopOpenQuestionRecord[]): string {
  const out = records.map((q) => {
    const sev = q.source === "gap" && q.severity ? `[${q.severity}] ` : "";
    const section = q.source === "gap" && q.section ? ` — ${q.section}` : "";
    return `- ${sev}${stripTrailingPunctuation(q.text)}${section}`;
  });
  return out.join("\n");
}

function executiveOpenQuestionSortKey(record: TopOpenQuestionRecord, issueBundleLower: string): number {
  let base = severityRankForOpenQuestion(record.severity) * 1000;
  if (record.source === "gap") base += 100;
  base -= Math.min(record.text.length, 400) / 200;
  if (severityRankForOpenQuestion(record.severity) >= 4) return base;
  const t = normalizeNeedText(record.text);
  if (gapTextSuggestsLegalOrCustomerNotice(t) && issueSignalsConsultation(issueBundleLower) && !issueSignalsLegalOrNoticePolicy(issueBundleLower)) {
    base -= 220;
  }
  return base;
}

function formatExecutiveOpenQuestionLine(q: TopOpenQuestionRecord, issue?: Pick<Issue, "title" | "summary" | "context">): string {
  const maxLen = 200;
  const bundleLower = issue ? bundleIssueText(issue).toLowerCase() : "";
  const rawLine = q.text.replace(/\n/g, " ").trim();
  const low = normalizeNeedText(rawLine);
  let body: string;
  if (
    issue &&
    gapTextSuggestsLegalOrCustomerNotice(low) &&
    issueSignalsConsultation(bundleLower) &&
    !issueSignalsLegalOrNoticePolicy(bundleLower)
  ) {
    body =
      "Confirm whether this legal notice question is applicable to this issue before it drives external messaging.";
  } else {
    body = trimForExecutiveClause(rawLine, maxLen);
    if (!/[.!?…]$/u.test(body)) body = `${stripTrailingPunctuation(body)}.`;
  }
  const sev = q.source === "gap" && q.severity ? `[${q.severity}] ` : "";
  const section = q.source === "gap" && q.section ? ` — ${q.section}` : "";
  return `- ${sev}${body}${section}`;
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
  const ranked = gatherTopOpenQuestionRecords(openQuestionsRaw, openGaps).slice(0, cap);
  return formatTopOpenQuestionsBody(ranked);
}

/**
 * Executive-only path after key merge: near-dedupe, optional leadership sort (demotes likely off-theme items when not critical),
 * safe clipping, and applicability framing. Exported for fixtures/tests (`issue` omitted uses legacy bullet formatting for stability).
 */
export function buildExecutiveOpenQuestionsBody(
  openQuestionsRaw: string,
  openGaps: Gap[],
  cap = 5,
  issue?: Pick<Issue, "title" | "summary" | "context">,
) {
  const gathered = dedupeExecutiveNearDuplicateQuestions(gatherTopOpenQuestionRecords(openQuestionsRaw, openGaps));
  const bundleLower = issue ? bundleIssueText(issue).toLowerCase() : "";
  const sorted =
    issue != null
      ? [...gathered].sort((a, b) => executiveOpenQuestionSortKey(b, bundleLower) - executiveOpenQuestionSortKey(a, bundleLower))
      : gathered;
  const capped = sorted.slice(0, cap);
  if (issue != null) return capped.map((r) => formatExecutiveOpenQuestionLine(r, issue)).join("\n");
  return formatTopOpenQuestionsBody(capped);
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

/** Title patterns that indicate smoke/test placeholders — omitted from Executive copy (still on file in Full / Sources). */
function isSmokeOrTestLikeSourceTitle(title: unknown): boolean {
  const t = cleanText(title ?? "");
  if (!t.length) return true;
  const low = t.toLowerCase();
  if (/\bsmoke\s*test\b|\bfixture\b|\bstubs?\b|\bplaceholder\b|\btemporary\b|\bscratch\b|\bdo not use\b|\btest\s*only\b/i.test(low)) return true;
  if (/^test\b/i.test(low) && low.length <= 44) return true;
  return false;
}

function tierProseLabel(tierRaw: string): string {
  const raw = cleanText(tierRaw);
  const t = raw.toLowerCase().replace(/\s+/g, " ").trim();
  if (t === "official") return "official or public-facing";
  if (t === "internal") return "internal";
  if (t === "media") return "media or third-party";
  if (/major\b/.test(t) && /\bmedia\b|\bpress\b|\bbroadcast\b/.test(t)) return "major-tier media or broadcast";
  if (/\bmajor\b/.test(t)) return "major-tier third-party";
  if (/\bmedia\b|\bpress\b|\bjournal\b/.test(t)) return "media or third-party";
  if (!raw.length || t === "unlabelled tier") return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function evidenceStrengthWord(n: number): "thin" | "light" | "moderate" | "broad" {
  if (n <= 1) return "thin";
  if (n <= 3) return "light";
  if (n <= 6) return "moderate";
  return "broad";
}

function buildExecutiveTierQualityClause(counts: Map<string, number>): string {
  const entries = [...counts.entries()].sort((a, b) => {
    const diff = b[1] - a[1];
    if (diff !== 0) return diff;
    return a[0].localeCompare(b[0], undefined, { sensitivity: "base" });
  });

  const parts: string[] = [];
  for (const [tier, c] of entries) {
    const label = tierProseLabel(tier);
    const w = numberToEnglish(c);
    const noun = c === 1 ? "record" : "records";
    if (!label) parts.push(`${w} ${noun} carrying no tier flag`);
    else parts.push(`${w} ${label} ${noun}`);
  }

  if (parts.length === 0) return "the tier picture is ambiguous from labels alone.";
  if (parts.length === 1) return `including ${parts[0]}.`;
  if (parts.length === 2) return `including ${parts[0]} and ${parts[1]}.`;
  return `including ${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}.`;
}

function evidenceExecutiveConfidenceSummary(rankedSources: Source[], totalLinked: number) {
  if (!totalLinked) {
    return "No linked source material is on file yet. Add substantive sources before treating external or leadership claims as attributable. For retrieval and audit trails, review the Sources page and Full brief.";
  }

  const substantive = rankedSources.filter((s) => !isSmokeOrTestLikeSourceTitle(s.title));
  const excludedSmoke = rankedSources.filter((s) => isSmokeOrTestLikeSourceTitle(s.title)).length;

  const poolForMix = substantive.length ? substantive : rankedSources;
  const withReliabilityLabel = poolForMix.filter((s) => Boolean(cleanText(s.reliability)));

  const counts = new Map<string, number>();
  for (const s of poolForMix) {
    const k = cleanText(s.tier) || "Unlabelled tier";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const official = substantive.length ? substantive.filter((s) => cleanText(s.tier).toLowerCase() === "official").length : 0;
  const nSub = substantive.length;

  let body: string;
  if (!nSub) {
    body =
      "Linked titles look like smoke or test scaffolding rather than substantive evidence—treat any leadership claim as unattributed until proper sources are uploaded.";
  } else {
    const strength = evidenceStrengthWord(nSub);
    const listClause = buildExecutiveTierQualityClause(counts);
    body = `The evidence base is ${strength}: ${numberToEnglish(nSub)} substantive ${nSub === 1 ? "record is" : "records are"} on file, ${listClause}`;

    if (official === 0) body += " There is still no Official-tier material in that set—keep outward lines visibly conditional.";
    else if (nSub === 1) body += " A single substantive record leaves little room for cross-check—add a second corroborating line before tightening language.";
    else body += " Where the topic is sensitive, still cross-check decisive points across at least two corroborating lines when practical.";

    if (!withReliabilityLabel.length) {
      body += " Reliability tags are mostly absent—lean on tiering and linkage, not unstated certainty.";
    } else if (withReliabilityLabel.length < poolForMix.length) {
      const missing = poolForMix.length - withReliabilityLabel.length;
      body += ` ${englishNumberCapitalizedForSentenceStart(missing)} linked ${missing === 1 ? "record" : "records"} still ${missing === 1 ? "lacks" : "lack"} reliability tags, so resist overstating evidentiary strength beyond what the tiers show.`;
    } else body += " Reliability tags exist, but they do not imply causal proof—continue pairing them with tiers and reviewer judgement.";

    if (excludedSmoke && substantive.length)
      body += ` ${englishNumberCapitalizedForSentenceStart(excludedSmoke)} additional linked ${excludedSmoke === 1 ? "title reads" : "titles read"} like a placeholder stub and stays out of this narrative; audit trails stay intact elsewhere.`;

    body = body.trim();
  }

  const tail =
    "\n\nFor source codes, snippets, placeholders, and the complete register—including anything omitted here—review the Sources page or the Evidence base panel in the Full brief.";

  return `${body}\n\nThis summary is directional only; it does not establish facts beyond what intake and Sources themselves record.${tail}`;
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

  function leadershipDecisionScaffoldLine(gap: Gap, rotationIndex: number): string | null {
    const rawAll = cleanText(gap.prompt || gap.title || "");
    if (!rawAll) return null;
    const rawOneLine = rawAll.replace(/\s+/g, " ").trim();
    const low = normalizeNeedText(rawOneLine);
    const bundleLower = bundleIssueText(issue).toLowerCase();
    const section = cleanText(gap.linkedSection ?? "");
    const sectionHint = section ? ` (${section})` : "";

    if (gapTextSuggestsLegalOrCustomerNotice(low) && !issueSignalsLegalOrNoticePolicy(bundleLower)) {
      return "Confirm whether any notice obligations apply before external lines are approved.";
    }

    if (gapSuggestsMaterialChangeConsultation(low) && (issueSignalsConsultation(bundleLower) || /\bmaterial\b/i.test(bundleLower))) {
      return "Set the decision owner and sign-off route for material changes driven by consultation feedback.";
    }

    if (
      gapSuggestsOpenVsFixedConsultation(low) ||
      (/\bconsultation\b/i.test(low) && /\b(open|fixed)\b/i.test(low) && /\b(constraint|scope|position)\b/i.test(low))
    ) {
      return "Approve the open-vs-fixed consultation position before the next stakeholder update.";
    }

    if (gapSuggestsConsultationAccess(low) && (issueSignalsConsultation(bundleLower) || /\bconsultation|community|public\b/i.test(bundleLower))) {
      return "Confirm the consultation access package and timing before the next public update.";
    }

    if (
      /\b(public|community|resident|citizen|stakeholder|audience|narrative|messaging|comms\b|communication|communications|press|external line)\b/.test(low)
    ) {
      const tail = trimForExecutiveClause(stripTrailingPunctuation(rawOneLine), 118);
      if (!tail) return null;
      return `Approve the communications posture regarding${sectionHint}: ${tail}`;
    }

    if (/\b(procurement|budget|contract|award|commercial|committee)\b/i.test(low)) {
      const tail = trimForExecutiveClause(stripTrailingPunctuation(rawOneLine), 120);
      if (!tail) return null;
      return `Agree procurement and approval sequencing tied to${sectionHint}: ${tail}`;
    }

    if (/\b(legal|authorised|authorized|approval route)\b/i.test(low)) {
      const tail = trimForExecutiveClause(stripTrailingPunctuation(rawOneLine), 120);
      if (!tail) return null;
      return `Align legal and delegated approval checkpoints for${sectionHint}: ${tail}`;
    }

    if (
      /\b(owner|ownership|deadline|due date|escalation path|routing|who decides|timeline|cadence|decision timeline)\b/.test(low)
    ) {
      const tail = trimForExecutiveClause(stripTrailingPunctuation(rawOneLine), 120);
      if (!tail) return null;
      return `Set the decision owner and escalation route for${sectionHint}: ${tail}`;
    }

    const scaffoldCycle = rotationIndex % 4;
    const prompt = trimForExecutiveClause(stripTrailingPunctuation(rawOneLine), 128);
    if (!prompt) return null;
    if (scaffoldCycle === 0) return `Confirm the leadership position regarding${sectionHint}: ${prompt}`;
    if (scaffoldCycle === 1) return `Agree delegated clearance for${sectionHint}: ${prompt}`;
    if (scaffoldCycle === 2) return `Set accountable ownership and timelines for${sectionHint}: ${prompt}`;
    return `Surface the unresolved decision needing executive sign-off regarding${sectionHint}: ${prompt}`;
  }

  const recommendedActionsForLeadership: string[] = (() => {
    const out: string[] = [];
    const oqBullets = splitOpenQuestionsToBullets(openQuestions);
    const hasGaps = rankedOpenGaps.length > 0;
    const hasOq = oqBullets.length > 0;

    if (hasGaps) {
      rankedOpenGaps.slice(0, 4).forEach((g, i) => {
        const line = leadershipDecisionScaffoldLine(g, i);
        if (line) out.push(sentence(line));
      });
    } else if (hasOq) {
      const seen = new Set<string>();
      for (const c of oqBullets) {
        const q = fixMalformedQuestionText(c);
        if (!q) continue;
        const key = normalizeQuestionThemeKey(q) || normalizeQuestionKey(q) || normalizeNeedText(q);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const shortPrompt = stripTrailingPunctuation(q.replace(/\s+/g, " "));
        const short = trimForExecutiveClause(shortPrompt, 110);
        if (/\bfollow[- ]?up\b|\bcadence\b|\bnamed owner\b/i.test(q)) {
          out.push("Confirm follow-up cadence and accountable owner routing before leadership uses firm commitments.");
        } else if (/\bproof point\b|\bevidence\b|\bcite\b|\bsources?\b/i.test(q)) {
          out.push("Agree what can be asserted vs what must remain conditional pending corroborating records.");
        } else if (/\bpartnership\b|\boffers?\b|\bprocurement\b|\bbudget\b|\bcommit(?:ment|ting)\b/i.test(q)) {
          out.push("Align leadership on disclosed constraints versus still-open commercial or partnership points.");
        } else if (/\btimeline\b|\bwhen\b|\bdates?\b|\bdecision point\b|\bsign[- ]?off\b/i.test(q)) {
          out.push("Fix decision milestones and disclose what timelines remain genuinely flexible.");
        } else if (short) {
          out.push(`Confirm the leadership decision on: ${short}`);
        }
        if (out.length >= 4) break;
      }
    }

    if ((!rankedSources.length && (hasGaps || hasOq)) || rankedSources.every((s) => isSmokeOrTestLikeSourceTitle(s.title))) {
      out.push("Link substantive sources so approvals can cite attributable material—not smoke-test placeholders—in the Sources register.");
    }

    if (orderedMessageAudienceNames.length) {
      out.push(sentence(`Stress-test external-facing lines for audience groups used in Messages (${orderedMessageAudienceNames.join(", ")}).`));
    } else if (cleanText(issue.audience ?? "")) {
      out.push(sentence(`Calibrate the line against the intake audience note (${cleanText(issue.audience ?? "")}).`));
    }

    if (cleanText(issue.ownerName ?? "")) {
      out.push(`Accountable owner for the cadence packaged with this briefing: ${issue.ownerName}.`);
    } else {
      out.push("Record a named accountable owner for unresolved decisions surfaced here.");
    }

    let deduped = dedupeActionLines(out);
    const thin = !hasGaps && !hasOq;
    if (thin && deduped.length < 2) {
      deduped = dedupeActionLines([...deduped, sentence("Confirm what remains under validation before broad or external circulation")]);
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
    const execQuestions = buildExecutiveOpenQuestionsBody(openQuestions, rankedOpenGaps, 5, issue);
    const summary = execQuestions ? capBulletBlock(execQuestions, 5) : "";
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
        { label: "Evidence base", body: evidenceExecutiveConfidenceSummary(rankedSources, rankedSources.length) },
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
