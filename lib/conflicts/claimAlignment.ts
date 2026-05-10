import type { ClaimStatus } from "@metis/shared/claim";

/** Claim fields needed for heuristic alignment (typically from SerializedClaim — no observation/source payloads). */
export type ClaimAlignmentClaimInput = {
  id: string;
  claimCode: string;
  text: string;
  status: ClaimStatus;
  notes?: string | null;
};

export type ClaimAlignmentSeverity = "info" | "warning" | "critical";

export type ClaimAlignmentFindingType =
  | "superseded_claim_referenced"
  | "assumption_stated_as_fact"
  | "needs_validation_stated_as_fact"
  | "possible_confirmed_claim_conflict"
  | "missing_caveat";

export type ClaimAlignmentFinding = {
  id: string;
  severity: ClaimAlignmentSeverity;
  type: ClaimAlignmentFindingType;
  claimCode: string;
  claimText: string;
  message: string;
  suggestedAction: string;
};

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "for",
  "with",
  "from",
  "this",
  "that",
  "these",
  "those",
  "are",
  "was",
  "were",
  "been",
  "being",
  "have",
  "has",
  "had",
  "will",
  "would",
  "could",
  "should",
]);

const CAVEAT_PATTERN =
  /\b(?:may|might|could|possibly|perhaps|probably|likely|appears?\s+to|seems?\s+to|suggest(?:s|ed|ing)?|based\s+on\s+current\s+information|not\s+yet\s+confirmed|still\s+(?:being\s+)?verif(?:y|ying|ied)|pending\s+(?:verification|confirmation)|subject\s+to\s+(?:verification|confirmation)|assuming|working\s+assumption|provisionally|until\s+(?:validated|confirmed)|unclear|needs?\s+validation|needs?\s+verification|to\s+be\s+confirmed)\b/i;

const NEGATION_PATTERN =
  /\b(?:do\s+not|does\s+not|did\s+not|is\s+not|are\s+not|was\s+not|were\s+not|has\s+not|have\s+not|cannot|can't|won't|will\s+not|no\s+longer|never\b|incorrect|false|untrue|disputed|rejected|contradicts?)\b/i;

const CLM_REF_PATTERN = /\b(CLM-\d{3,})\b/gi;

function collapseWhitespace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function normalizeComparable(text: string) {
  const lower = collapseWhitespace(text.toLowerCase().replace(/\r\n/g, "\n"));
  return lower.replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function splitIntoSentences(text: string): string[] {
  const chunks = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  for (const c of chunks) {
    for (const line of c.split(/\n+/).map((l) => l.trim()).filter(Boolean)) out.push(line);
  }
  return out.length ? out : [collapseWhitespace(text)];
}

function tokenizeKeywords(norm: string) {
  return norm.split(/\s+/).filter(Boolean);
}

/** Substring containment; token quorum yields soft `{ tokenOnly: true }`. */
function findPhraseMatch(hayNorm: string, phraseNorm: string, minSnippet: number, maxSnippet: number): { snippet: string; tokenOnly: boolean } | null {
  if (!phraseNorm.length) return null;
  const max = Math.min(Math.max(maxSnippet, minSnippet), phraseNorm.length);
  const min = Math.min(minSnippet, max);

  for (let win = max; win >= min; win -= Math.max(6, Math.floor(win / 5))) {
    const head = phraseNorm.slice(0, win);
    const tail = phraseNorm.slice(-win);
    if (hayNorm.includes(head)) return { snippet: head, tokenOnly: false };
    if (hayNorm.includes(tail)) return { snippet: tail, tokenOnly: false };
    const step = Math.max(12, Math.floor(win / 3));
    for (let start = 0; start + win <= phraseNorm.length; start += step) {
      const snip = phraseNorm.slice(start, start + win);
      if (hayNorm.includes(snip)) return { snippet: snip, tokenOnly: false };
    }
  }

  const hTok = new Set(tokenizeKeywords(hayNorm));
  let hits = 0;
  let total = 0;
  for (const tok of tokenizeKeywords(phraseNorm)) {
    if (tok.length < 4 || STOPWORDS.has(tok)) continue;
    total++;
    if (hTok.has(tok)) hits++;
  }
  if (total >= 4 && hits / total >= 0.58) return { snippet: "__tokens__", tokenOnly: true };
  return null;
}

function sentenceForSnippet(fullText: string, substringNorm: string): string | null {
  if (!substringNorm || substringNorm === "__tokens__") {
    const parts = splitIntoSentences(fullText);
    return parts[0]?.slice(0, 520) ?? fullText.trim().slice(0, 520);
  }
  for (const sent of splitIntoSentences(fullText)) {
    if (normalizeComparable(sent).includes(substringNorm)) return sent;
  }
  const flat = normalizeComparable(fullText);
  return flat.includes(substringNorm) ? fullText.trim().slice(0, 900) : null;
}

function hasCaveat(s: string) {
  return CAVEAT_PATTERN.test(s);
}

function simpleHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

let counter = 0;

/** Test helper: deterministic ids when asserting finding shapes. */
export function resetClaimAlignmentIdCounterForTests() {
  counter = 0;
}

function nextId(kind: string, claimCode: string, detail: string) {
  counter += 1;
  return `${kind}_${claimCode}_${simpleHash(detail.slice(0, 64))}_${counter}`;
}

/** Human-facing wording from stored message artefacts (headline + section bodies/titles — not guardrails). */
export function flattenMessageArtifactForClaimAlignment(artifact: {
  metadata: { publicHeadline?: string };
  sections: readonly { title: string; body: string }[];
}): string {
  const head = artifact.metadata.publicHeadline?.replaceAll("\\n", "\n").trim() ?? "";
  const blocks = artifact.sections.map((s) => `${s.title.replaceAll("\\n", "\n").trim()}\n${s.body.replaceAll("\\n", "\n").trim()}`);
  return [head, ...blocks].filter(Boolean).join("\n\n");
}

/** Resolve claim rows explicitly mentioning `CLM-###` in the artefact body. */
function parseClaimRefs(fullText: string, claims: ClaimAlignmentClaimInput[]) {
  const out: ClaimAlignmentClaimInput[] = [];
  CLM_REF_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  const seenCodes = new Set<string>();
  while ((m = CLM_REF_PATTERN.exec(fullText))) {
    const code = m[1].toUpperCase();
    const row = claims.find((c) => c.claimCode.toUpperCase() === code);
    if (!row || seenCodes.has(row.claimCode)) continue;
    seenCodes.add(row.claimCode);
    out.push(row);
  }
  return out;
}

/**
 * Deterministic heuristic pass — no persistence, DB, or activity.
 * Intended for passive review banners on saved message drafts only.
 */
export function evaluateClaimAlignmentForText(fullText: string, claimsIn: ClaimAlignmentClaimInput[]): ClaimAlignmentFinding[] {
  resetClaimAlignmentIdCounterForTests();

  const hay = normalizeComparable(fullText);
  if (hay.length < 90) return [];

  const claims = claimsIn.filter((c) => c.text.replace(/\s+/g, "").length >= 10);
  const findings: ClaimAlignmentFinding[] = [];

  /** De-dupe by type+code (+ conflict window) across code + phrase rules */
  const seen = new Set<string>();

  /** --- References by claim code literal --- */
  for (const refRow of parseClaimRefs(fullText, claims)) {
    const ctxSnippet = sentenceForSnippet(fullText, normalizeComparable(refRow.claimCode)) ?? fullText.trim().slice(0, 400);
    const hedged = hasCaveat(ctxSnippet);

    if (refRow.status === "Superseded") {
      const key = `${refRow.claimCode}:super:any`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        id: nextId("supcode", refRow.claimCode, refRow.text),
        severity: "critical",
        type: "superseded_claim_referenced",
        claimCode: refRow.claimCode,
        claimText: refRow.text,
        message: `The draft references ${refRow.claimCode}, marked Superseded — do not circulate that label as authoritative.`,
        suggestedAction: `Remove/update ${refRow.claimCode}; add a successor claim if the narrative still applies.`,
      });
      continue;
    }

    if (refRow.status === "Assumption" && !hedged) {
      const key = `asm:any:${refRow.claimCode}`;
      if (!seen.has(key)) {
        seen.add(key);
        findings.push({
          id: nextId("asmcode", refRow.claimCode, refRow.text),
          severity: "warning",
          type: "assumption_stated_as_fact",
          claimCode: refRow.claimCode,
          claimText: refRow.text,
          message: `${refRow.claimCode} remains an Assumption — citing its code plainly may read as fact unless hedged.`,
          suggestedAction: `Add conditional wording (working assumption / may / subject to verification) or uplift the claim after validation.`,
        });
      }
    }

    if (refRow.status === "NeedsValidation" && !hedged) {
      const key = `nv:any:${refRow.claimCode}`;
      if (!seen.has(key)) {
        seen.add(key);
        findings.push({
          id: nextId("nvcode", refRow.claimCode, refRow.text),
          severity: "critical",
          type: "needs_validation_stated_as_fact",
          claimCode: refRow.claimCode,
          claimText: refRow.text,
          message: `${refRow.claimCode} still Needs validation — avoid asserting it boldly in stakeholder copy.`,
          suggestedAction: `Add explicit uncertainty, or finalize validation before relying on ${refRow.claimCode} in circulating language.`,
        });
      }
    }
  }

  /** --- Textual overlap signals --- */
  for (const claim of claims) {
    const phraseNorm = normalizeComparable(claim.text);
    if (!phraseNorm) continue;

    const minSnippet = phraseNorm.length > 140 ? 38 : phraseNorm.length > 80 ? 30 : Math.min(24, phraseNorm.length);
    const maxSnippet = Math.min(110, phraseNorm.length);

    const match = findPhraseMatch(hay, phraseNorm, Math.min(minSnippet, maxSnippet), maxSnippet);

    /** Superseded phrase echo — strong prohibition */
    if (claim.status === "Superseded" && match && !match.tokenOnly) {
      const key = `${claim.claimCode}:super:any`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        id: nextId("supphrase", claim.claimCode, match.snippet),
        severity: "critical",
        type: "superseded_claim_referenced",
        claimCode: claim.claimCode,
        claimText: claim.text,
        message: `Wording closely parallels ${claim.claimCode}, which is Superseded — retire it from stakeholder-facing drafts.`,
        suggestedAction: `Replace with current Confirmed items or provisional language tied to Needs validation assumptions explicitly.`,
      });
      continue;
    }

    if (claim.status === "Confirmed") {
      if (!match || match.tokenOnly) continue;
      const sentence = sentenceForSnippet(fullText, match.snippet);
      if (!sentence || !NEGATION_PATTERN.test(sentence)) continue;

      const key = `conf:${claim.claimCode}:${match.snippet.slice(0, 24)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        id: nextId("neg", claim.claimCode, sentence),
        severity: "warning",
        type: "possible_confirmed_claim_conflict",
        claimCode: claim.claimCode,
        claimText: claim.text,
        message: `${claim.claimCode} reads as Confirmed, yet nearby draft language contradicts its thrust — reconcile before circulation.`,
        suggestedAction: `Align the passage with Claims (${claim.claimCode}) or update the Confirmed statement if intentionally superseded.`,
      });
      continue;
    }

    if (!match) continue;

    const scoped = sentenceForSnippet(fullText, match.tokenOnly ? "__tokens__" : match.snippet) ?? collapseWhitespace(fullText.slice(0, 650));
    const hedgedLocal = hasCaveat(scoped);

    /** Assumption / NeedsValidation */
    if (claim.status === "Assumption") {
      if (!match.tokenOnly && hedgedLocal) continue;
      if (match.tokenOnly && hedgedLocal) continue;
      const key = `asm:any:${claim.claimCode}`;
      if (seen.has(key)) continue;
      seen.add(key);

      findings.push({
        id: nextId("asmphrase", claim.claimCode, claim.text),
        severity: match.tokenOnly ? "info" : "warning",
        type: match.tokenOnly ? "missing_caveat" : "assumption_stated_as_fact",
        claimCode: claim.claimCode,
        claimText: claim.text,
        message: match.tokenOnly
          ? `Fragments may echo ${claim.claimCode} (Assumption); consider clearer hedged language.`
          : `Draft parallels ${claim.claimCode} without obvious hedges — clarify it is provisional.`,
        suggestedAction: `Prefer explicit assumption language (may / working assumption / subject to verification) or promote the claim after validation.`,
      });
      continue;
    }

    if (claim.status === "NeedsValidation") {
      if (!match.tokenOnly && hedgedLocal) continue;
      /** Token-only weak signal with hedging — skip noisy info */
      if (match.tokenOnly && hedgedLocal) continue;
      const key = `nv:any:${claim.claimCode}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        id: nextId("nvphrase", claim.claimCode, claim.text),
        severity: match.tokenOnly ? "warning" : "critical",
        type: match.tokenOnly ? "missing_caveat" : "needs_validation_stated_as_fact",
        claimCode: claim.claimCode,
        claimText: claim.text,
        message: match.tokenOnly
          ? `${claim.claimCode} may be implied — keep uncertainty audible while validation is open.`
          : `Draft mirrors ${claim.claimCode} (still Needs validation) without cautious framing.`,
        suggestedAction: `Either layer explicit uncertainty wording or tighten the claim via validation before circulation.`,
      });
    }
  }

  const rank: Record<ClaimAlignmentSeverity, number> = { critical: 0, warning: 1, info: 2 };
  findings.sort((a, b) => {
    const d = rank[a.severity] - rank[b.severity];
    return d !== 0 ? d : a.claimCode.localeCompare(b.claimCode);
  });
  return findings;
}
