import type { Claim, Gap, Issue } from "@prisma/client";

import {
  buildExecutiveClaimsDoNotSayBullets,
  claimsToGenerationRows,
  groupClaimsForSynthesis,
} from "@/lib/claims/claimsForGeneration";
import { rankOpenGapsForIssue } from "@/lib/evidence/rankEvidence";

export type MessageAudienceProfile = "service_users" | "councillors" | "staff" | "media" | "generic";

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function bundleIssueText(issue: Pick<Issue, "title" | "summary" | "context">): string {
  return [cleanText(issue.title), cleanText(issue.summary), cleanText(issue.context ?? "")].filter(Boolean).join(" ");
}

export function issueSignalsConsultationHours(issue: Issue): boolean {
  const t = bundleIssueText(issue).toLowerCase();
  return /\bconsultation\b/.test(t) && /\b(opening hours|service hours|hours change)\b/.test(t);
}

export function resolveMessageAudienceProfile(audienceLabel: string, templateId: string): MessageAudienceProfile {
  const label = audienceLabel.toLowerCase();
  if (templateId === "media_holding_line" || /\bmedia\b|\bpress\b/.test(label)) return "media";
  if (/\bstaff\b|\bfront desk\b|\bfront-desk\b/.test(label)) return "staff";
  if (/\bcouncillors?\b|\bcommunity representatives?\b|\belected\b|\bmember\b/.test(label)) return "councillors";
  if (/\bservice users?\b|\bresident\b|\bcustomer\b|\bpublic\b/.test(label)) return "service_users";
  return "generic";
}

export type MessageRecordGrounding = {
  consultationIssue: boolean;
  confirmedLines: string[];
  assumptionLines: string[];
  doNotSay: string[];
  serviceCutHoldingLine: string;
  equalityCaveat: string;
  circulationCaveat: string;
  hasCriticalOpen: boolean;
  openCount: number;
};

function gapDoNotSayBullets(gaps: Gap[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (line: string) => {
    const k = line.toLowerCase();
    if (!line || seen.has(k)) return;
    seen.add(k);
    out.push(line);
  };
  for (const g of rankOpenGapsForIssue(gaps, { onlyOpen: true })) {
    const t = `${g.prompt ?? ""} ${g.title ?? ""}`.replace(/\s+/g, " ").toLowerCase();
    if (/\b(opening hours|proposed hours|exact hours|hours option)\b/.test(t)) {
      push("Do not quote specific opening hours until the proposed option is signed off for consultation.");
    }
    if (/\b(equality impact assessment|equality assessment)\b/.test(t)) {
      push("Do not state that equality impacts have been assessed until the assessment is published.");
    }
    if (/\b(media|press)\b/.test(t) && /\b(service cut|cut)\b/.test(t)) {
      push("If asked whether this is a service cut, use the agreed holding line — do not improvise.");
    }
  }
  return out;
}

export function buildMessageRecordGrounding(issue: Issue, claims: Claim[], gaps: Gap[]): MessageRecordGrounding {
  const consultationIssue = issueSignalsConsultationHours(issue);
  const grouped = groupClaimsForSynthesis(claims);
  const confirmedLines = grouped.confirmed.map((c) => c.text);
  const assumptionLines = grouped.assumptions.map((c) => c.text);

  const open = rankOpenGapsForIssue(gaps, { onlyOpen: true });
  const hasCriticalOpen = open.some((g) => String(g.severity ?? "").trim() === "Critical");

  const doNotSay = [
    ...buildExecutiveClaimsDoNotSayBullets(claims),
    ...gapDoNotSayBullets(gaps),
    "Do not imply that a final decision on opening hours has already been made.",
    "Do not repeat inaccurate social claims that the service is closing early from next month.",
  ];
  const uniqueDoNotSay = [...new Set(doNotSay.map((l) => l.trim()).filter(Boolean))];

  const serviceCutHoldingLine =
    "This is a consultation on how opening hours might change — not a confirmed service reduction. No final decision has been made; options are under review and consultation feedback will shape any recommendation.";

  const equalityCaveat =
    "The equality impact assessment is not yet complete. Do not state that there will be no adverse impact on any group until that assessment is available.";

  const circulationCaveat = hasCriticalOpen
    ? "Critical open questions remain on the record — treat this draft as provisional for internal briefing, not a final external position."
    : open.length > 0
      ? "Some details are still open on the record — avoid firm commitments beyond the confirmed lines below."
      : "Human review and sign-off are still required before external circulation.";

  return {
    consultationIssue,
    confirmedLines,
    assumptionLines,
    doNotSay: uniqueDoNotSay,
    serviceCutHoldingLine,
    equalityCaveat,
    circulationCaveat,
    hasCriticalOpen,
    openCount: open.length,
  };
}

function normalizeConfirmedSentence(text: string): string {
  return text.trim().replace(/\.$/, "").toLowerCase();
}

function isNearDuplicateConfirmedSentence(candidate: string, existing: string[]): boolean {
  const n = normalizeConfirmedSentence(candidate);
  return existing.some((line) => {
    const e = normalizeConfirmedSentence(line);
    return e === n || e.includes(n) || n.includes(e);
  });
}

/** Plain sentences safe for external copy (confirmed claims only). */
export function formatConfirmedForExternalCopy(confirmedLines: string[], intakeConfirmed: string): string {
  const lines: string[] = [];
  const push = (raw: string) => {
    const t = raw.replace(/^-+\s*/, "").trim();
    if (!t) return;
    const sentence = t.endsWith(".") ? t : `${t}.`;
    if (isNearDuplicateConfirmedSentence(sentence, lines)) return;
    lines.push(sentence);
  };
  if (intakeConfirmed) {
    for (const raw of intakeConfirmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
      push(raw);
    }
  }
  for (const t of confirmedLines) {
    push(t);
  }
  return lines.join(" ");
}

export function formatDoNotSayBlock(doNotSay: string[], max = 6): string {
  const items = doNotSay.slice(0, max);
  if (!items.length) return "Apply standard validation discipline before external use.";
  return items
    .map((l) => {
      const line = l
        .replace(/^Do not say yet that /i, "Do not state that ")
        .replace(/^Do not say yet /i, "Do not ");
      return `- ${line}`;
    })
    .join("\n");
}

export function activeClaimsSummary(claims: Claim[]): string {
  const rows = claimsToGenerationRows(claims);
  if (!rows.length) return "No active claims on the register.";
  const g = groupClaimsForSynthesis(claims);
  const parts: string[] = [];
  if (g.confirmed.length) parts.push(`${g.confirmed.length} confirmed`);
  if (g.assumptions.length) parts.push(`${g.assumptions.length} assumption(s)`);
  if (g.needsValidation.length) parts.push(`${g.needsValidation.length} need validation`);
  return `Claims on record: ${parts.join(" · ")}.`;
}
