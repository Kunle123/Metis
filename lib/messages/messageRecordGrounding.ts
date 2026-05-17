import type { Claim, Gap, Issue } from "@prisma/client";

import {
  buildExecutiveClaimsDoNotSayBullets,
  claimsToGenerationRows,
  groupClaimsForSynthesis,
} from "@/lib/claims/claimsForGeneration";
import { isNearDuplicateSentence } from "@/lib/brief/executiveNarrativeSanitize";
import { rankOpenGapsForIssue } from "@/lib/evidence/rankEvidence";

export type MessageAudienceProfile = "service_users" | "councillors" | "staff" | "media" | "generic";

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isStakeholderUnsafeLine(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /feasibility qa/.test(t) ||
    /\bdev seed\b/.test(t) ||
    /dev\/staging/.test(t) ||
    /intended to test whether metis/.test(t) ||
    /not production content/.test(t) ||
    /live-style comms issue/.test(t)
  );
}

/** Guardrail lines for mustAvoid metadata — grammatically correct “Do not state …”. */
export function formatMustAvoidLine(line: string): string {
  return line
    .replace(/^Do not say yet when /i, "Do not state when ")
    .replace(/^Do not say yet that /i, "Do not state that ")
    .replace(/^Do not say yet /i, "Do not state ");
}

function bundleIssueText(issue: Pick<Issue, "title" | "summary" | "context">): string {
  return [cleanText(issue.title), cleanText(issue.summary), cleanText(issue.context ?? "")].filter(Boolean).join(" ");
}

export function issueSignalsConsultationHours(issue: Issue): boolean {
  const t = bundleIssueText(issue).toLowerCase();
  return /\bconsultation\b/.test(t) && /\b(opening hours|service hours|hours change)\b/.test(t);
}

function isCompoundIntakeAudienceNote(audienceLabel: string): boolean {
  return /,/.test(audienceLabel) || /\band\b/i.test(audienceLabel);
}

function profileFromCompoundIntakeAudience(label: string): MessageAudienceProfile {
  const patterns: { re: RegExp; profile: MessageAudienceProfile }[] = [
    { re: /\bservice users?\b/, profile: "service_users" },
    { re: /\bcouncillors?\b|\bcommunity representatives?\b|\belected representatives?\b/, profile: "councillors" },
    { re: /\bresident\b|\bcustomer\b|\bpublic\b/, profile: "service_users" },
    { re: /\bmedia\b|\bpress\b/, profile: "media" },
  ];
  let best: { index: number; profile: MessageAudienceProfile } | null = null;
  for (const { re, profile } of patterns) {
    const m = label.match(re);
    if (m && m.index !== undefined && (!best || m.index < best.index)) {
      best = { index: m.index, profile };
    }
  }
  return best?.profile ?? "generic";
}

export function resolveMessageAudienceProfile(audienceLabel: string, templateId: string): MessageAudienceProfile {
  const label = audienceLabel.toLowerCase();

  if (templateId === "internal_staff_update") {
    if (/\bstaff\b|\bfront desk\b|\bfront-desk\b/.test(label)) return "staff";
    return "generic";
  }

  if (templateId === "media_holding_line") return "media";

  if (isCompoundIntakeAudienceNote(audienceLabel)) {
    return profileFromCompoundIntakeAudience(label);
  }

  if (/\bmedia\b|\bpress\b/.test(label)) return "media";
  if (/\bcouncillors?\b|\bcommunity representatives?\b|\belected representatives?\b/.test(label)) return "councillors";
  if (/\bservice users?\b|\bresident\b|\bcustomer\b/.test(label)) return "service_users";
  if (/\bpublic\b/.test(label)) return "service_users";
  return "generic";
}

/** External consultation copy variant when the issue is consultation-hours shaped. */
export function consultationExternalProfile(
  profile: MessageAudienceProfile,
): "service_users" | "councillors" {
  return profile === "councillors" ? "councillors" : "service_users";
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

export const SERVICE_USER_CONSULTATION_MIDDLE_PARAGRAPH =
  "The review is looking at how opening hours can best reflect demand, staffing pressures and access needs. Consultation feedback will help shape the final recommendation.";

export const COUNCILLOR_CONSULTATION_CONTEXT_PARAGRAPH =
  "The current record supports saying that options are under review, that staffing pressure and usage patterns are part of the context, and that consultation feedback will inform the final recommendation.";

function toConfirmedSentence(raw: string): string {
  const t = raw.replace(/^-+\s*/, "").trim();
  if (!t) return "";
  return t.endsWith(".") ? t : `${t}.`;
}

function isNearDuplicateConfirmedSentence(candidate: string, existing: string[]): boolean {
  return existing.some((line) => isNearDuplicateSentence(candidate, line));
}

/** Intake + confirmed claims, deduped — intake first, then register lines not near-duplicates. */
export function collectDedupedConfirmedFactLines(confirmedLines: string[], intakeConfirmed: string): string[] {
  const lines: string[] = [];
  const push = (raw: string) => {
    const sentence = toConfirmedSentence(raw);
    if (!sentence || isStakeholderUnsafeLine(sentence)) return;
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
  return lines;
}

function lineSignalsOptionsUnderReview(line: string): boolean {
  const t = line.toLowerCase();
  return (
    /\bconsultation options\b/.test(t) ||
    (/\b(under review|options)\b/.test(t) && /\b(opening hours|service opening hours|hours change)\b/.test(t))
  );
}

function lineSignalsNoFinalDecision(line: string): boolean {
  return /no final decision/i.test(line);
}

function lineSignalsStaffingUsageContext(line: string): boolean {
  const t = line.toLowerCase();
  return (
    /staffing pressure/.test(t) ||
    /uneven usage/.test(t) ||
    /usage patterns/.test(t) ||
    /opening-hours model is being reviewed/.test(t)
  );
}

export function lineSignalsEarlyClosureCorrection(line: string): boolean {
  const t = line.toLowerCase();
  return (
    /early closure/.test(t) ||
    /imminent early closure/.test(t) ||
    (/inaccurate/.test(t) && /current record/.test(t))
  );
}

/** True when the record carries the core consultation-safe fact themes (4444-style rich intake). */
export function recordHasCoreConsultationSafeFacts(lines: string[]): boolean {
  if (!lines.length) return false;
  const joined = lines.join(" ");
  return (
    lineSignalsOptionsUnderReview(joined) &&
    lineSignalsNoFinalDecision(joined) &&
    lineSignalsStaffingUsageContext(joined) &&
    lineSignalsEarlyClosureCorrection(joined)
  );
}

function isRepresentedByConsultationTemplate(line: string): boolean {
  return (
    lineSignalsOptionsUnderReview(line) ||
    lineSignalsNoFinalDecision(line) ||
    lineSignalsStaffingUsageContext(line) ||
    lineSignalsEarlyClosureCorrection(line)
  );
}

/** Facts not already covered by the consultation template paragraphs or near-duplicates of them. */
export function filterFactsNotRepresentedInConsultationTemplate(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const sentence = toConfirmedSentence(raw);
    if (!sentence || isStakeholderUnsafeLine(sentence)) continue;
    if (isRepresentedByConsultationTemplate(sentence)) continue;
    if (isNearDuplicateConfirmedSentence(sentence, out)) continue;
    out.push(sentence);
  }
  return out;
}

/**
 * Middle paragraph for consultation-hours external drafts — template when core facts are present,
 * otherwise deduped additional facts only, with template fallback.
 */
export function buildConsultationExternalMiddleParagraph(
  profile: "service_users" | "councillors",
  confirmedLines: string[],
  intakeConfirmed: string,
): string {
  const allLines = collectDedupedConfirmedFactLines(confirmedLines, intakeConfirmed);
  const template =
    profile === "councillors"
      ? COUNCILLOR_CONSULTATION_CONTEXT_PARAGRAPH
      : SERVICE_USER_CONSULTATION_MIDDLE_PARAGRAPH;

  if (recordHasCoreConsultationSafeFacts(allLines)) {
    const additional = filterFactsNotRepresentedInConsultationTemplate(allLines);
    if (!additional.length) return template;
    return `${template}\n\n${additional.join(" ")}`;
  }

  const filtered = filterFactsNotRepresentedInConsultationTemplate(allLines);
  if (filtered.length) return filtered.join(" ");
  return template;
}

/** Plain sentences safe for external copy (confirmed claims only). */
export function formatConfirmedForExternalCopy(confirmedLines: string[], intakeConfirmed: string): string {
  return collectDedupedConfirmedFactLines(confirmedLines, intakeConfirmed).join(" ");
}

export function formatDoNotSayBlock(doNotSay: string[], max = 6): string {
  const items = doNotSay.slice(0, max);
  if (!items.length) return "Apply standard validation discipline before external use.";
  return items.map((l) => `- ${formatMustAvoidLine(l)}`).join("\n");
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
