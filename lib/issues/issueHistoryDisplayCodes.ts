import { prisma } from "@/lib/db/prisma";
import {
  formatClaimCode,
  formatGapCode,
  formatNumericSourceCode,
  formatObservationCode,
  parseNumericSourceCodeOrdinal,
} from "@/lib/issueRecordCodes";

import type { IssueHistoryRelatedRecord } from "./issueHistoryTypes";

function truncate(text: string, max = 80): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function sourceCodeLabel(sourceCode: string, ordinal: number): string {
  const trimmed = sourceCode.trim();
  if (trimmed) {
    const parsed = parseNumericSourceCodeOrdinal(trimmed);
    if (parsed != null) return formatNumericSourceCode(parsed);
    return trimmed;
  }
  return formatNumericSourceCode(ordinal);
}

export type IssueHistoryDisplayRegistry = {
  resolve(id: string): IssueHistoryRelatedRecord | null;
};

export async function loadIssueHistoryDisplayRegistry(issueId: string): Promise<IssueHistoryDisplayRegistry> {
  const [sources, claims, gaps, inputs, briefs, messages, exports] = await Promise.all([
    prisma.source.findMany({
      where: { issueId },
      orderBy: { createdAt: "asc" },
      select: { id: true, sourceCode: true, title: true },
    }),
    prisma.claim.findMany({
      where: { issueId },
      orderBy: { createdAt: "asc" },
      select: { id: true, claimNumber: true, text: true },
    }),
    prisma.gap.findMany({
      where: { issueId },
      orderBy: { createdAt: "asc" },
      select: { id: true, gapNumber: true, title: true },
    }),
    prisma.internalInput.findMany({
      where: { issueId },
      orderBy: { createdAt: "asc" },
      select: { id: true, observationNumber: true, name: true, role: true },
    }),
    prisma.briefVersion.findMany({
      where: { issueId },
      orderBy: { createdAt: "asc" },
      select: { id: true, mode: true, versionNumber: true },
    }),
    prisma.messageVariant.findMany({
      where: { issueId },
      orderBy: { createdAt: "asc" },
      select: { id: true, templateId: true, versionNumber: true },
    }),
    prisma.artifactExport.findMany({
      where: { issueId },
      orderBy: { createdAt: "asc" },
      select: { id: true, format: true, filename: true },
    }),
  ]);

  const byId = new Map<string, IssueHistoryRelatedRecord>();

  sources.forEach((s, i) => {
    const code = sourceCodeLabel(s.sourceCode, i + 1);
    byId.set(s.id, {
      id: s.id,
      code,
      label: s.title,
      recordType: "Source",
      href: `/issues/${issueId}/sources`,
    });
  });

  claims.forEach((c) => {
    const code = formatClaimCode(c.claimNumber) ?? "CLM";
    byId.set(c.id, {
      id: c.id,
      code,
      label: truncate(c.text, 100),
      recordType: "Claim",
      href: `/issues/${issueId}/claims`,
    });
  });

  gaps.forEach((g) => {
    const code = formatGapCode(g.gapNumber) ?? "Q";
    byId.set(g.id, {
      id: g.id,
      code,
      label: g.title,
      recordType: "Open question",
      href: `/issues/${issueId}/gaps`,
    });
  });

  inputs.forEach((input) => {
    const code = formatObservationCode(input.observationNumber) ?? "OBS";
    byId.set(input.id, {
      id: input.id,
      code,
      label: input.name.trim() || input.role.trim() || "Incoming update",
      recordType: "Incoming update",
      href: `/issues/${issueId}/input`,
    });
  });

  briefs.forEach((b) => {
    const modeLabel = b.mode === "executive" ? "Executive brief" : "Full brief";
    byId.set(b.id, {
      id: b.id,
      code: `${modeLabel} v${b.versionNumber}`,
      label: `${modeLabel} version ${b.versionNumber}`,
      recordType: "Brief",
      href: `/issues/${issueId}/brief?mode=${b.mode}`,
    });
  });

  messages.forEach((m) => {
    byId.set(m.id, {
      id: m.id,
      code: `Message v${m.versionNumber}`,
      label: m.templateId.replace(/_/g, " "),
      recordType: "Message",
      href: `/issues/${issueId}/messages`,
    });
  });

  exports.forEach((e) => {
    byId.set(e.id, {
      id: e.id,
      code: e.format.toUpperCase(),
      label: e.filename,
      recordType: "Export",
      href: `/issues/${issueId}/export`,
    });
  });

  return {
    resolve(id: string) {
      return byId.get(id) ?? null;
    },
  };
}

export function resolveRelatedRecordIds(
  registry: IssueHistoryDisplayRegistry,
  ids: string[],
): IssueHistoryRelatedRecord[] {
  const out: IssueHistoryRelatedRecord[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const resolved = registry.resolve(id);
    if (resolved) out.push(resolved);
  }
  return out;
}
