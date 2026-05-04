/**
 * Deterministic ranking for brief/message generation inputs.
 * Uses only existing DB/API fields — no supersession, pin, or dispute semantics yet (see options below).
 */

import type { Gap, InternalInput, Source } from "@prisma/client";

/** Canonical source tiers used in Sources UI (extras sort after these). */
const SOURCE_TIER_ORDER = ["Official", "Internal", "Major media", "Market signal"] as const;

function normalizeTier(tier: string | null | undefined): string {
  return String(tier ?? "").trim();
}

/** Lower = ranked earlier (more prominent). Unknown tiers rank after canonical list, lexically. */
export function sourceTierRank(tier: string | null | undefined): number {
  const t = normalizeTier(tier);
  const i = SOURCE_TIER_ORDER.indexOf(t as (typeof SOURCE_TIER_ORDER)[number]);
  if (i >= 0) return i;
  return SOURCE_TIER_ORDER.length + 1;
}

/** Lower = better reliability for ordering. */
export function reliabilitySortKey(raw: string | null | undefined): number {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s.length) return 100;
  if (/\bhigh\b|\bstrong\b|\bverified\b|\bconfirmed\b/i.test(s)) return 0;
  if (/\bmedium\b|\bmoderate\b/.test(s)) return 1;
  if (/\blow\b|\bweak\b|\bunverified\b/.test(s)) return 2;
  return 3;
}

function normalizeSection(section: string | null | undefined): string {
  return String(section ?? "").trim().toLowerCase();
}

function sectionProximity(linkedSection: string | null | undefined, target: string | null | undefined): number {
  const t = normalizeSection(target);
  if (!t) return 0;
  const ls = normalizeSection(linkedSection);
  if (!ls) return 1;
  if (ls === t) return 0;
  if (ls.includes(t) || t.includes(ls)) return 0;
  return 1;
}

function tieBreakSource(a: Source, b: Source): number {
  const id = a.id.localeCompare(b.id);
  if (id !== 0) return id;
  const code = cleanText(a.sourceCode).localeCompare(cleanText(b.sourceCode));
  if (code !== 0) return code;
  return cleanText(a.title).localeCompare(cleanText(b.title));
}

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export type RankSourcesOptions = {
  /** When set, matching `linkedSection` ranks earlier. */
  linkedSectionTarget?: string | null;
};

/** Rank sources for brief/message context: tier, reliability signal, optional section match, then recency. */
export function rankSourcesForIssue(sources: readonly Source[], options?: RankSourcesOptions): Source[] {
  const target = options?.linkedSectionTarget ?? null;
  return [...sources].sort((a, b) => {
    const tr = sourceTierRank(a.tier) - sourceTierRank(b.tier);
    if (tr !== 0) return tr;

    const rr = reliabilitySortKey(a.reliability) - reliabilitySortKey(b.reliability);
    if (rr !== 0) return rr;

    const sr = sectionProximity(a.linkedSection, target) - sectionProximity(b.linkedSection, target);
    if (sr !== 0) return sr;

    const ta = a.createdAt.getTime();
    const tb = b.createdAt.getTime();
    if (tb !== ta) return tb - ta;

    return tieBreakSource(a, b);
  });
}

/**
 * Lower = earlier in list when sorting gaps (severity).
 * Aligns Brief `severityRank`, API UI sort, and shared `GapSeveritySchema`.
 */
export function gapSeveritySortKey(severity: string | null | undefined): number {
  const s = String(severity ?? "").trim();
  if (s === "Critical") return 0;
  if (s === "Important") return 1;
  if (s === "Watch") return 2;
  const low = s.toLowerCase();
  if (low.includes("critical") || low.includes("high")) return 0;
  if (low.includes("important")) return 1;
  if (low.includes("watch") || low.includes("normal")) return 2;
  return 9;
}

function isOpenGap(g: Gap): boolean {
  return String(g.status).trim() === "Open";
}

export type RankOpenGapsOptions = {
  /** When true, only `status === "Open"` gaps are returned (ranked). Default false. */
  onlyOpen?: boolean;
  linkedSectionTarget?: string | null;
};

/**
 * Rank gaps: open status first (when not `onlyOpen`), severity, optional section match, newer `updatedAt`, stable id.
 */
export function rankOpenGapsForIssue(gaps: readonly Gap[], options?: RankOpenGapsOptions): Gap[] {
  const onlyOpen = options?.onlyOpen ?? false;
  const target = options?.linkedSectionTarget ?? null;
  const pool = onlyOpen ? gaps.filter(isOpenGap) : [...gaps];

  return pool.sort((a, b) => {
    if (!onlyOpen) {
      const ao = isOpenGap(a) ? 0 : 1;
      const bo = isOpenGap(b) ? 0 : 1;
      if (ao !== bo) return ao - bo;
    }

    const sev = gapSeveritySortKey(a.severity) - gapSeveritySortKey(b.severity);
    if (sev !== 0) return sev;

    const sec = sectionProximity(a.linkedSection, target) - sectionProximity(b.linkedSection, target);
    if (sec !== 0) return sec;

    const ua = a.updatedAt.getTime();
    const ub = b.updatedAt.getTime();
    if (ub !== ua) return ub - ua;

    return a.id.localeCompare(b.id);
  });
}

/** Higher = more prominent for internal observations. */
export function internalInputConfidenceScore(confidence: string | null | undefined): number {
  const c = String(confidence ?? "").trim();
  const low = c.toLowerCase();
  if (c === "Confirmed" || low === "high") return 4;
  if (c === "Likely" || low === "medium") return 3;
  if (c === "Needs validation") return 2;
  if (c === "Unclear" || low === "low") return 1;
  return 0;
}

export function isLowInternalInputConfidence(confidence: string | null | undefined): boolean {
  return internalInputConfidenceScore(confidence) <= 1;
}

export type RankInternalInputsOptions = {
  /** When true, rows with `excludedFromBrief` are omitted. Default false. */
  excludeFromBrief?: boolean;
  linkedSectionTarget?: string | null;
};

export function rankInternalInputsForIssue(inputs: readonly InternalInput[], options?: RankInternalInputsOptions): InternalInput[] {
  const exclude = options?.excludeFromBrief ?? false;
  const target = options?.linkedSectionTarget ?? null;
  const pool = exclude ? inputs.filter((i) => !Boolean((i as InternalInput).excludedFromBrief)) : [...inputs];

  return pool.sort((a, b) => {
    const ca = internalInputConfidenceScore(a.confidence);
    const cb = internalInputConfidenceScore(b.confidence);
    if (cb !== ca) return cb - ca;

    const sec = sectionProximity(a.linkedSection, target) - sectionProximity(b.linkedSection, target);
    if (sec !== 0) return sec;

    const ta = a.createdAt.getTime();
    const tb = b.createdAt.getTime();
    if (tb !== ta) return tb - ta;

    return a.id.localeCompare(b.id);
  });
}
