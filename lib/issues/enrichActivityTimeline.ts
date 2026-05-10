import { prisma } from "@/lib/db/prisma";
import { formatClaimCode, formatGapCode, formatObservationCode } from "@/lib/issueRecordCodes";

import type { ActivityTimelineItem, SerializedActivityRow } from "@/lib/issues/activityTimelineDisplay";
import type { ObservationViewer } from "@/lib/internalInputs/internalObservationVisibility";
import { internalObservationReadableByViewer } from "@/lib/internalInputs/internalObservationVisibility";

function briefRevisionLabel(mode: string, versionNumber: number): string {
  const m = mode === "executive" ? "Executive" : "Full";
  return `${m} brief v${versionNumber}`;
}

/**
 * Joins ref rows for version-aware activity headlines. Falls back to stored `summary`
 * when refs are missing or unknown (caller uses `activityTimelineDisplaySummary`).
 */
export async function enrichActivityRowsForIssue(
  issueId: string,
  rows: SerializedActivityRow[],
  opts?: { viewer?: ObservationViewer },
): Promise<ActivityTimelineItem[]> {
  const briefIds = new Set<string>();
  const messageIds = new Set<string>();
  const exportIds = new Set<string>();
  const circulationIds = new Set<string>();
  const gapIds = new Set<string>();
  const internalInputIds = new Set<string>();
  const sourceIds = new Set<string>();
  const claimIds = new Set<string>();

  for (const r of rows) {
    if (!r.refId?.trim()) continue;
    if (r.refType === "BriefVersion") briefIds.add(r.refId);
    else if (r.refType === "MessageVariant") messageIds.add(r.refId);
    else if (r.refType === "ArtifactExport") exportIds.add(r.refId);
    else if (r.refType === "CirculationEvent") circulationIds.add(r.refId);
    else if (r.refType === "Gap") gapIds.add(r.refId);
    else if (r.refType === "InternalInput") internalInputIds.add(r.refId);
    else if (r.refType === "Source") sourceIds.add(r.refId);
    else if (r.refType === "Claim") claimIds.add(r.refId);
  }

  const [briefRows, messageRows, exportRows, circulationRows, gapRows, internalInputRows, sourceRows, claimRows] = await Promise.all([
    briefIds.size
      ? prisma.briefVersion.findMany({
          where: { issueId, id: { in: [...briefIds] } },
          select: { id: true, mode: true, versionNumber: true },
        })
      : [],
    messageIds.size
      ? prisma.messageVariant.findMany({
          where: { issueId, id: { in: [...messageIds] } },
          select: { id: true, templateId: true, versionNumber: true },
        })
      : [],
    exportIds.size
      ? prisma.artifactExport.findMany({
          where: { issueId, id: { in: [...exportIds] } },
          select: {
            id: true,
            format: true,
            briefVersion: { select: { mode: true, versionNumber: true } },
          },
        })
      : [],
    circulationIds.size
      ? prisma.circulationEvent.findMany({
          where: { issueId, id: { in: [...circulationIds] } },
          select: {
            id: true,
            eventType: true,
            channel: true,
            briefVersion: { select: { mode: true, versionNumber: true } },
          },
        })
      : [],
    gapIds.size
      ? prisma.gap.findMany({
          where: { issueId, id: { in: [...gapIds] } },
          select: { id: true, gapNumber: true },
        })
      : [],
    internalInputIds.size
      ? prisma.internalInput.findMany({
          where: { issueId, id: { in: [...internalInputIds] } },
          select: { id: true, observationNumber: true, visibility: true, createdByUserId: true },
        })
      : [],
    sourceIds.size
      ? prisma.source.findMany({
          where: { issueId, id: { in: [...sourceIds] } },
          select: { id: true, sourceCode: true },
        })
      : [],
    claimIds.size
      ? prisma.claim.findMany({
          where: { issueId, id: { in: [...claimIds] } },
          select: { id: true, claimNumber: true },
        })
      : [],
  ]);

  const briefMap = new Map(briefRows.map((b) => [b.id, b]));
  const messageMap = new Map(messageRows.map((m) => [m.id, m]));
  const exportMap = new Map(exportRows.map((e) => [e.id, e]));
  const circulationMap = new Map(circulationRows.map((c) => [c.id, c]));
  const gapRecordCodeById = new Map(
    gapRows.map((g) => [g.id, formatGapCode(g.gapNumber)] as [string, string | null]),
  );
  const viewer = opts?.viewer;
  const observationRecordCodeById = new Map<string, string | null>();
  for (const i of internalInputRows) {
    let code: string | null = formatObservationCode(i.observationNumber);
    if (
      viewer &&
      !internalObservationReadableByViewer(viewer, { visibility: i.visibility, createdByUserId: i.createdByUserId })
    ) {
      code = null;
    }
    observationRecordCodeById.set(i.id, code);
  }
  const sourceRecordCodeById = new Map<string, string>();
  for (const s of sourceRows) {
    const c = (s.sourceCode ?? "").trim();
    if (c.length) sourceRecordCodeById.set(s.id, c);
  }

  const claimRecordCodeById = new Map<string, string>();
  for (const c of claimRows) {
    const code = formatClaimCode(c.claimNumber);
    if (code) claimRecordCodeById.set(c.id, code);
  }

  return rows.map((row) => {
    let enrichedSummary: string | null = null;
    let refRecordCode: string | null = null;

    if (row.refType === "Gap" && row.refId) {
      refRecordCode = gapRecordCodeById.get(row.refId) ?? null;
    } else if (row.refType === "InternalInput" && row.refId) {
      refRecordCode = observationRecordCodeById.get(row.refId) ?? null;
    } else if (row.refType === "Source" && row.refId) {
      refRecordCode = sourceRecordCodeById.get(row.refId) ?? null;
    } else if (row.refType === "Claim" && row.refId) {
      refRecordCode = claimRecordCodeById.get(row.refId) ?? null;
    }

    if (row.kind === "brief_version_created" && row.refType === "BriefVersion" && row.refId) {
      const b = briefMap.get(row.refId);
      if (b) enrichedSummary = `${briefRevisionLabel(b.mode, b.versionNumber)} created`;
    } else if (row.kind === "message_variant_created" && row.refType === "MessageVariant" && row.refId) {
      const m = messageMap.get(row.refId);
      if (m) enrichedSummary = `Message draft v${m.versionNumber} created (${m.templateId})`;
    } else if (row.kind === "message_variant_approval_updated" && row.refType === "MessageVariant" && row.refId) {
      const m = messageMap.get(row.refId);
      if (m) enrichedSummary = `Message draft v${m.versionNumber} · ${row.summary}`;
    } else if (row.kind === "export_approval_updated" && row.refType === "ArtifactExport" && row.refId) {
      const ex = exportMap.get(row.refId);
      const bv = ex?.briefVersion;
      const pack = bv ? `${bv.mode === "executive" ? "Executive" : "Full"} brief v${bv.versionNumber} · ${ex?.format ?? "package"}` : "Export package";
      enrichedSummary = `${pack} · ${row.summary}`;
    } else if (row.kind === "export_created" && row.refType === "ArtifactExport" && row.refId) {
      const ex = exportMap.get(row.refId);
      const bv = ex?.briefVersion;
      if (bv) enrichedSummary = `Export package created from ${briefRevisionLabel(bv.mode, bv.versionNumber)}`;
    } else if (row.kind === "circulation_event_created" && row.refType === "CirculationEvent" && row.refId) {
      const c = circulationMap.get(row.refId);
      const bv = c?.briefVersion;
      if (c && bv) {
        const parts = [c.eventType];
        if (c.channel) parts.push(String(c.channel));
        enrichedSummary = `Circulation · ${parts.join(" · ")} · from ${briefRevisionLabel(bv.mode, bv.versionNumber)}`;
      }
    }

    return { ...row, enrichedSummary, refRecordCode };
  });
}
