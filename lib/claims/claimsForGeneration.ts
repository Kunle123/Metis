import type { Claim } from "@prisma/client";

import type { ClaimStatus } from "@metis/shared/claim";
import { formatClaimCode } from "@/lib/issueRecordCodes";

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

/**
 * Body for the executive “Claims and assumptions” block — concise register only (no intake facts).
 */
export function formatExecutiveClaimsAndAssumptionsBody(claims: Claim[]): string {
  if (!hasActiveClaimsForBriefing(claims)) return "";
  return formatClaimsBriefBlock(claims, { maxPerGroup: 5 }).trimEnd();
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
