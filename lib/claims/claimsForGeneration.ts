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

export function formatClaimsBriefBlock(claims: Claim[]): string {
  const g = groupClaimsForSynthesis(claims);
  const lines: string[] = [];

  const pushSection = (title: string, items: ClaimGenerationRow[], guidance: string) => {
    if (!items.length) return;
    lines.push(title);
    lines.push(guidance);
    for (const it of items) {
      lines.push(`- ${it.code}: ${it.text}${it.notes ? ` (${it.notes})` : ""}`);
    }
    lines.push("");
  };

  pushSection(
    "Confirmed claims (may be stated as established for this workspace)",
    g.confirmed,
    "Treat as factual for internal drafts only where consistent with Sources and intake.",
  );
  pushSection(
    "Assumptions (phrase conditionally)",
    g.assumptions,
    "Use hedged language — e.g. working assumption, subject to verification.",
  );
  pushSection(
    "Needs validation (do not assert)",
    g.needsValidation,
    "Flag uncertainty; do not present as settled fact until validated.",
  );

  const supersededCount = claims.filter((c) => coerceClaimStatus(c.status) === "Superseded").length;
  if (supersededCount > 0) {
    lines.push(`Superseded claims: ${supersededCount} omitted from briefing context (see Claims register).`, "");
  }

  if (!lines.length) return "No active claims recorded yet.";
  return lines.join("\n").trimEnd();
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
