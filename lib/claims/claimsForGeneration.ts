import type { Claim } from "@prisma/client";

import type { ClaimStatus } from "@metis/shared/claim";
import { formatClaimCode } from "@/lib/issueRecordCodes";

import {
  intakeConfirmedToSentences,
  isNearDuplicateSentence,
} from "@/lib/brief/executiveNarrativeSanitize";

import { coerceClaimStatus } from "./coerceClaimStatus";

export type ClaimGenerationRow = {
  code: string;
  text: string;
  status: ClaimStatus;
  notes: string | null;
};

export function claimsToGenerationRows(claims: Claim[]): ClaimGenerationRow[] {
  const rows: ClaimGenerationRow[] = [];
  for (const c of claims) {
    const status = coerceClaimStatus(c.status);
    if (status === "Superseded") continue;
    const code = formatClaimCode(c.claimNumber);
    if (!code) continue;
    rows.push({
      code,
      text: c.text.replace(/\s+/g, " ").trim(),
      status,
      notes: c.notes?.trim() ? c.notes.trim() : null,
    });
  }
  return rows;
}

/** Group non-superseded claims for prompts (brief AI + deterministic context lines). */
export function groupClaimsForSynthesis(claims: Claim[]) {
  const rows = claimsToGenerationRows(claims);
  return {
    confirmed: rows.filter((r) => r.status === "Confirmed"),
    assumptions: rows.filter((r) => r.status === "Assumption"),
    needsValidation: rows.filter((r) => r.status === "NeedsValidation"),
  };
}

export type FormatClaimsBriefOptions = {
  /** Executive brief: keep register concise. */
  maxPerGroup?: number;
};

function sliceRows(rows: ClaimGenerationRow[], max?: number): { shown: ClaimGenerationRow[]; truncated: boolean } {
  if (max == null || rows.length <= max) return { shown: rows, truncated: false };
  return { shown: rows.slice(0, max), truncated: true };
}

/**
 * Markdown-friendly claims register for briefs and internal message artifacts.
 * Superseded rows are omitted from lists; a tally line is appended when superseded rows exist.
 */
export function formatClaimsBriefBlock(claims: Claim[], options?: FormatClaimsBriefOptions): string {
  const g = groupClaimsForSynthesis(claims);
  const max = options?.maxPerGroup;
  const lines: string[] = [];

  const { shown: confShown, truncated: confTrunc } = sliceRows(g.confirmed, max);
  if (confShown.length) {
    lines.push("### Confirmed claims");
    for (const it of confShown) {
      lines.push(`- ${it.code}: ${it.text}${it.notes ? ` (${it.notes})` : ""}`);
    }
    if (confTrunc) lines.push(`- …${g.confirmed.length - confShown.length} more confirmed claim(s) — see Claims.`);
    lines.push("");
  }

  const { shown: asmShown, truncated: asmTrunc } = sliceRows(g.assumptions, max);
  if (asmShown.length) {
    lines.push("### Assumptions — phrase conditionally");
    lines.push(
      "Use hedged language such as “current working assumption”, “appears”, “suggests”, or “subject to confirmation”.",
    );
    for (const it of asmShown) {
      lines.push(`- ${it.code}: ${it.text}${it.notes ? ` (${it.notes})` : ""}`);
    }
    if (asmTrunc) lines.push(`- …${g.assumptions.length - asmShown.length} more assumption(s) — see Claims.`);
    lines.push("");
  }

  const { shown: nvShown, truncated: nvTrunc } = sliceRows(g.needsValidation, max);
  if (nvShown.length) {
    lines.push("### Needs validation — do not state as fact");
    lines.push("Treat these as unresolved until confirmed by source or accountable owner.");
    for (const it of nvShown) {
      lines.push(`- ${it.code}: ${it.text}${it.notes ? ` (${it.notes})` : ""}`);
    }
    if (nvTrunc) lines.push(`- …${g.needsValidation.length - nvShown.length} more item(s) — see Claims.`);
    lines.push("");
  }

  const supersededCount = claims.filter((c) => coerceClaimStatus(c.status) === "Superseded").length;
  if (supersededCount > 0) {
    lines.push(`Superseded claims: ${supersededCount} omitted from briefing output.`, "");
  }

  if (!lines.length) return "No active claims recorded yet.";
  return lines.join("\n").trimEnd();
}

/** True when at least one non-superseded claim exists for briefing lists. */
export function hasActiveClaimsForBriefing(claims: Claim[]): boolean {
  return claimsToGenerationRows(claims).length > 0;
}

export type ClaimsPositionCounts = {
  confirmed: number;
  assumptions: number;
  needsValidation: number;
  superseded: number;
};

export function countClaimsForExecutive(claims: Claim[]): ClaimsPositionCounts {
  const counts: ClaimsPositionCounts = {
    confirmed: 0,
    assumptions: 0,
    needsValidation: 0,
    superseded: 0,
  };
  for (const row of claims) {
    const status = coerceClaimStatus(row.status);
    if (status === "Confirmed") counts.confirmed += 1;
    else if (status === "Assumption") counts.assumptions += 1;
    else if (status === "NeedsValidation") counts.needsValidation += 1;
    else if (status === "Superseded") counts.superseded += 1;
  }
  return counts;
}

/** One-line executive tally before detailed CLM lines. */
export function formatExecutiveClaimsPositionLine(claims: Claim[]): string {
  const c = countClaimsForExecutive(claims);
  const parts: string[] = [];
  if (c.confirmed > 0) parts.push(`${c.confirmed} confirmed`);
  if (c.assumptions > 0) parts.push(`${c.assumptions} assumption${c.assumptions === 1 ? "" : "s"}`);
  if (c.needsValidation > 0) parts.push(`${c.needsValidation} need validation`);
  if (c.superseded > 0) parts.push(`${c.superseded} superseded`);
  if (!parts.length) return "";
  return `Claims position: ${parts.join(" · ")}.`;
}

function claimTextBundle(c: Claim): string {
  return `${c.text} ${c.notes ?? ""}`.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Claim-derived “do not say yet” lines for executive guardrails (specific before generic).
 */
export function buildExecutiveClaimsDoNotSayBullets(claims: Claim[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (line: string) => {
    const key = line.toLowerCase();
    if (!line || seen.has(key)) return;
    seen.add(key);
    out.push(line);
  };

  for (const c of claims) {
    const status = coerceClaimStatus(c.status);
    const t = claimTextBundle(c);

    if (status === "Superseded") {
      if (/\b(close|closing|earlier|early closure)\b/.test(t)) {
        push("Do not say yet that the service is closing early or that early closure is happening next month.");
      }
      continue;
    }

    if (status !== "NeedsValidation") continue;

    if (/\b(opening hours|exact hours|final hours|proposed hours|weekday hours|evening slot)\b/.test(t)) {
      push("Do not say yet what the final opening hours will be.");
    }
    if (/\b(save|saving|savings|money|cost)\b/.test(t) && /\b(without|quality|service)\b/.test(t)) {
      push("Do not say yet that the change will save money without reducing service quality.");
    }
    if (/\b(equality|adverse impact|older residents|working families)\b/.test(t)) {
      push("Do not say yet that there is no adverse equality impact.");
    }
    if (/\b(service quality|quality reduction|reduce quality)\b/.test(t)) {
      push("Do not say yet that service quality will not be reduced.");
    }
    if (/\b(equality impact assessment|equality assessment)\b/.test(t) && /\b(complete|before|opens)\b/.test(t)) {
      push("Do not say yet when the equality impact assessment will be complete.");
    }
  }

  return out;
}

function filterConfirmedClaimsNotInIntake(claims: Claim[], intakeConfirmed: string): Claim[] {
  const intakeLines = intakeConfirmedToSentences(intakeConfirmed);
  if (!intakeLines.length) return claims;
  return claims.filter((c) => {
    if (coerceClaimStatus(c.status) !== "Confirmed") return true;
    const text = c.text.replace(/\s+/g, " ").trim();
    return !intakeLines.some((line) => isNearDuplicateSentence(line, text));
  });
}

/**
 * Body for the executive “Claims and assumptions” block — position summary then capped register detail.
 * Confirmed claims that duplicate intake confirmed facts appear only in Confirmed facts, not again here.
 */
export function formatExecutiveClaimsAndAssumptionsBody(claims: Claim[], intakeConfirmed = ""): string {
  if (!hasActiveClaimsForBriefing(claims)) return "";
  const summary = formatExecutiveClaimsPositionLine(claims);
  const forDetail = filterConfirmedClaimsNotInIntake(claims, intakeConfirmed);
  const detail = formatClaimsBriefBlock(forDetail, { maxPerGroup: 3 }).trimEnd();
  if (!summary) return detail;
  return `${summary}\n\n${detail}`;
}

export function formatClaimsGuardrailLine(): string {
  return "Claims register: exclude superseded items; caveat assumptions; never assert needs-validation lines as settled fact.";
}

export function augmentExternalConfirmedWithClaims(confirmedFacts: string, claims: Claim[]): string {
  const g = groupClaimsForSynthesis(claims);
  if (!g.confirmed.length) return confirmedFacts;
  const claimBullets = g.confirmed.map((c) => `- ${c.text}`).join("\n");
  if (!confirmedFacts.trim()) {
    return `What we can confirm (from claims register):\n${claimBullets}`;
  }
  return `${confirmedFacts.trim()}\n\nAdditional coordinated confirmations (claims register):\n${claimBullets}`;
}

/** Appends caveat bullets for assumptions and validation-needed claims near uncertainty messaging. */
export function externalMessageClaimsCaveats(claims: Claim[]): string {
  const g = groupClaimsForSynthesis(claims);
  const parts: string[] = [];
  if (g.assumptions.length) {
    parts.push(
      "Working assumptions (not yet framed as verified fact):\n" +
        g.assumptions.map((c) => `- ${c.text}`).join("\n"),
    );
  }
  if (g.needsValidation.length) {
    parts.push(
      "Still under validation internally — avoid stating confidently:\n" +
        g.needsValidation.map((c) => `- ${c.text}`).join("\n"),
    );
  }
  return parts.join("\n\n");
}
