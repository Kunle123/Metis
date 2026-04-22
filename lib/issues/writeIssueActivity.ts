import type { Prisma, PrismaClient } from "@prisma/client";

import type { IssueActivityKind } from "@metis/shared/activity";

export async function writeIssueActivity(
  tx: Prisma.TransactionClient | PrismaClient,
  {
    issueId,
    kind,
    summary,
    refType,
    refId,
    actorLabel,
    at,
  }: {
    issueId: string;
    kind: IssueActivityKind;
    summary: string;
    refType?: string | null;
    refId?: string | null;
    actorLabel?: string | null;
    at?: Date;
  },
) {
  const createdAt = at ?? new Date();
  const trimmed = summary.trim();
  if (trimmed.length === 0) throw new Error("IssueActivity.summary cannot be empty");

  const activity = await tx.issueActivity.create({
    data: {
      issueId,
      kind,
      summary: trimmed,
      refType: refType ?? null,
      refId: refId ?? null,
      actorLabel: actorLabel ?? null,
      createdAt,
    },
  });

  await tx.issue.update({
    where: { id: issueId },
    data: { lastActivityAt: createdAt },
  });

  return activity;
}

