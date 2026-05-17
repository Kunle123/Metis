import type { Issue } from "@prisma/client";

import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";
import type { ExportFormat } from "@metis/shared/export";

import { prisma } from "@/lib/db/prisma";
import { coerceMessageApprovalStatus } from "@/lib/approvals/coerceMessageApprovalStatus";

import {
  type BriefingPackContext,
  messageVariantToBriefingPackMessage,
} from "./briefingPack";

const TEMPLATE_ORDER = ["external_customer_resident_student", "internal_staff_update", "media_holding_line"] as const;

export async function loadBriefingPackContext(
  issue: Pick<
    Issue,
    "id" | "title" | "ownerName" | "status" | "severity" | "priority" | "updatedAt" | "sourcesCount" | "openGapsCount"
  >,
  opts: {
    format: ExportFormat;
    sourceBriefLabel: string;
    generatedAt?: Date;
  },
): Promise<BriefingPackContext> {
  const [variants, claimsCount] = await Promise.all([
    prisma.messageVariant.findMany({
      where: { issueId: issue.id },
      orderBy: [{ versionNumber: "desc" }],
    }),
    prisma.claim.count({ where: { issueId: issue.id } }),
  ]);

  const latestByTemplate = new Map<string, (typeof variants)[number]>();
  for (const row of variants) {
    if (!latestByTemplate.has(row.templateId)) {
      latestByTemplate.set(row.templateId, row);
    }
  }

  const messages = TEMPLATE_ORDER.flatMap((templateId) => {
    const row = latestByTemplate.get(templateId);
    if (!row) return [];
    const parsed = MessageVariantArtifactSchema.safeParse(row.artifact);
    if (!parsed.success) return [];
    return [
      messageVariantToBriefingPackMessage(
        templateId,
        parsed.data,
        coerceMessageApprovalStatus(row.approvalStatus),
      ),
    ];
  });

  return {
    issue,
    format: opts.format,
    sourceBriefLabel: opts.sourceBriefLabel,
    generatedAt: opts.generatedAt ?? new Date(),
    messages,
    claimsCount,
  };
}
