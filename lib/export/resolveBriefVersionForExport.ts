import type { BriefVersion } from "@prisma/client";

import { BriefModeSchema, type BriefMode } from "@metis/shared/briefVersion";
import type { ExportFormat } from "@metis/shared/export";

import { prisma } from "@/lib/db/prisma";

const DESC: { createdAt: "desc" } = { createdAt: "desc" };

export type ResolvedBriefForExport = {
  briefVersion: BriefVersion;
  /** Stored BriefVersion.mode powering preview/download */
  sourceMode: BriefMode;
  /** Executive-brief requested but only a Full BriefVersion exists — export uses Full snapshot exec blocks */
  executiveBriefUsesFullBriefFallback: boolean;
};

/** Choose which BriefVersion backs export preview and download/copy (same id as POST /export). */
export async function resolveBriefVersionForExport(
  issueId: string,
  urlMode: BriefMode,
  selectedFormat: ExportFormat,
): Promise<ResolvedBriefForExport | null> {
  if (selectedFormat === "executive-brief") {
    const executive = await prisma.briefVersion.findFirst({
      where: { issueId, mode: "executive" },
      orderBy: DESC,
    });
    if (executive) {
      return {
        briefVersion: executive,
        sourceMode: "executive",
        executiveBriefUsesFullBriefFallback: false,
      };
    }
    const full = await prisma.briefVersion.findFirst({
      where: { issueId, mode: "full" },
      orderBy: DESC,
    });
    if (full) {
      return {
        briefVersion: full,
        sourceMode: "full",
        executiveBriefUsesFullBriefFallback: true,
      };
    }
    return null;
  }

  if (selectedFormat === "full-issue-brief") {
    const full = await prisma.briefVersion.findFirst({
      where: { issueId, mode: "full" },
      orderBy: DESC,
    });
    if (!full) return null;
    const sm = BriefModeSchema.safeParse(full.mode);
    return {
      briefVersion: full,
      sourceMode: sm.success ? sm.data : "full",
      executiveBriefUsesFullBriefFallback: false,
    };
  }

  const bv = await prisma.briefVersion.findFirst({
    where: { issueId, mode: urlMode },
    orderBy: DESC,
  });
  if (!bv) return null;
  const sm = BriefModeSchema.safeParse(bv.mode);
  return {
    briefVersion: bv,
    sourceMode: sm.success ? sm.data : "full",
    executiveBriefUsesFullBriefFallback: false,
  };
}
