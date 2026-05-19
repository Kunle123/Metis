/**
 * DOCX executive pack compression — caps sections and dedupes lines for a ~2-page layout.
 */
import type { BriefArtifact } from "@metis/shared/briefVersion";

import {
  dedupeExecutiveDoNotSayBullets,
  filterParagraphsNotInBody,
  isNearDuplicateSentence,
  normalizeSentenceForDedupe,
  sanitizeExecutiveOwnerName,
} from "@/lib/brief/executiveNarrativeSanitize";
import type {
  ExecutiveBriefLineItem,
  ExecutiveBriefPresentationModel,
} from "@/lib/brief/parseExecutiveBriefPresentation";
import { slicePresentationItems } from "@/lib/brief/parseExecutiveBriefPresentation";

import type { BriefingPackContext } from "./briefingPack";
import { briefingPackRecordBasisLines, sanitizeExportText } from "./briefingPack";

export const EXEC_PACK_LIMITS = {
  confirmedFacts: 5,
  decisions: 5,
  validationClaims: 4,
  openQuestions: 5,
  safeToSay: 6,
  doNotSayYet: 6,
  messages: 3,
  recordBasisLines: 4,
} as const;

export type CompactExecutivePackView = {
  title: string;
  circulation: string;
  generatedLabel: string;
  ownerLabel: string;
  statusLabel: string;
  severityLabel: string;
  readFirstParagraphs: string[];
  decisions: string[];
  statusRows: { label: string; value: string }[];
  confirmedFacts: string[];
  validationClaims: ExecutiveBriefLineItem[];
  openQuestions: string[];
  safeToSay: string[];
  doNotSayYet: string[];
  recordBasisLines: string[];
  messages: BriefingPackContext["messages"];
  sourceBriefLabel: string;
};

function stripListMarkers(text: string): string {
  return sanitizeExportText(text)
    .replace(/^[-*•]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

export function isUnsafeGuardrailLine(line: string): boolean {
  const t = stripListMarkers(line);
  if (!t) return true;
  if (/^do not say yet\b/i.test(t)) return true;
  if (/^do not\b/i.test(t)) return true;
  if (/\bdo not\b/i.test(t)) return true;
  if (/^avoid\b/i.test(t)) return true;
  if (/^never\b/i.test(t)) return true;
  return false;
}

export function dedupeCompactLines(lines: string[], max: number): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const line = stripListMarkers(raw);
    if (!line || isUnsafeGuardrailLine(line)) continue;
    if (out.some((existing) => isNearDuplicateSentence(existing, line))) continue;
    out.push(line);
    if (out.length >= max) break;
  }
  return out;
}

function parseStatusRowsForPack(
  assessmentBody: string,
  header: ExecutiveBriefPresentationModel["header"],
): { label: string; value: string }[] {
  const kv: Record<string, string> = {};
  for (const raw of assessmentBody.split("\n")) {
    const line = raw.trim();
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (m) kv[m[1]!.trim().toLowerCase()] = sanitizeExportText(m[2]!);
  }

  const add = (label: string, value: string | undefined) => {
    if (value?.trim()) rows.push({ label, value: sanitizeExportText(value) });
  };

  const rows: { label: string; value: string }[] = [];
  add("Status", kv.status ?? header.status);
  add("Briefing confidence", kv["briefing confidence"]);
  add("External position", kv["external position"]);
  add("Briefing posture", kv["briefing posture"] ?? header.briefingPosture);
  add("Open questions", kv["open questions"] ?? header.openQuestionsLabel);
  return rows.slice(0, 5);
}

function buildReadFirstParagraphs(model: ExecutiveBriefPresentationModel): string[] {
  const summary = sanitizeExportText(model.position.executiveSummary);
  const sufficiencyRaw = model.position.recordSufficiency?.trim() ?? "";
  const sufficiencyParts = sufficiencyRaw
    ? sufficiencyRaw
        .split(/\n{2,}/)
        .map((p) => sanitizeExportText(p.replace(/\n/g, " ")))
        .filter(Boolean)
    : [];
  const sufficiencyFiltered = summary
    ? filterParagraphsNotInBody(sufficiencyParts, summary)
    : sufficiencyParts;

  const merged = [...(summary ? [summary] : []), ...sufficiencyFiltered].filter(Boolean);
  const out: string[] = [];
  for (const p of merged) {
    if (out.some((e) => isNearDuplicateSentence(e, p))) continue;
    out.push(p);
    if (out.length >= 3) break;
  }
  return out;
}

function confirmedFactKeys(facts: string[]): Set<string> {
  return new Set(facts.map((f) => normalizeSentenceForDedupe(stripListMarkers(f))).filter(Boolean));
}

export function buildCompactExecutivePackView(
  model: ExecutiveBriefPresentationModel,
  ctx: BriefingPackContext,
  artifact: BriefArtifact,
  assessmentBody: string,
): CompactExecutivePackView {
  const confirmedFacts = dedupeCompactLines(model.confirmedFacts, EXEC_PACK_LIMITS.confirmedFacts);
  const factKeys = confirmedFactKeys(confirmedFacts);

  const validationGroup = model.claimGroups.find((g) => g.id === "needsValidation");
  const { shown: validationClaims } = slicePresentationItems(
    validationGroup?.items ?? [],
    EXEC_PACK_LIMITS.validationClaims,
  );

  const decisions = dedupeCompactLines(
    model.decisions.map((d) => d.text),
    EXEC_PACK_LIMITS.decisions,
  );

  const openQuestions = dedupeCompactLines(model.openQuestions, EXEC_PACK_LIMITS.openQuestions);

  const safeToSay = dedupeCompactLines(
    model.safeToSay.filter((line) => !isUnsafeGuardrailLine(line) && !factKeys.has(normalizeSentenceForDedupe(line))),
    EXEC_PACK_LIMITS.safeToSay,
  );

  const doNotSayYet = dedupeExecutiveDoNotSayBullets(model.doNotSayYet)
    .map(stripListMarkers)
    .filter(Boolean)
    .slice(0, EXEC_PACK_LIMITS.doNotSayYet);

  const recordBasisAll = briefingPackRecordBasisLines(ctx, artifact).map((l) => sanitizeExportText(l));
  const recordBasisLines = recordBasisAll.slice(0, EXEC_PACK_LIMITS.recordBasisLines);

  const owner = sanitizeExecutiveOwnerName(ctx.issue.ownerName ?? model.header.owner);

  return {
    title: sanitizeExportText(model.header.title),
    circulation: sanitizeExportText(model.header.circulation),
    generatedLabel: ctx.sourceBriefLabel,
    ownerLabel: owner,
    statusLabel: sanitizeExportText(ctx.issue.status),
    severityLabel: sanitizeExportText(ctx.issue.severity),
    readFirstParagraphs: buildReadFirstParagraphs(model),
    decisions,
    statusRows: parseStatusRowsForPack(assessmentBody, model.header),
    confirmedFacts,
    validationClaims,
    openQuestions,
    safeToSay,
    doNotSayYet,
    recordBasisLines,
    messages: ctx.messages.slice(0, EXEC_PACK_LIMITS.messages),
    sourceBriefLabel: ctx.sourceBriefLabel,
  };
}
