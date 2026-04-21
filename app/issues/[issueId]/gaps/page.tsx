import { notFound } from "next/navigation";

import { MetisShell } from "@/components/MetisShell";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { GapSchema } from "@metis/shared/gap";

import { GapLedger } from "./gap-ledger";

export const dynamic = "force-dynamic";

export default async function IssueGapsPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const issue = await getIssueById(issueId);
  if (!issue) notFound();

  const [gapsRaw, internalInputsRaw] = await Promise.all([
    prisma.gap.findMany({ where: { issueId: issue.id } }),
    prisma.internalInput.findMany({
      where: { issueId: issue.id },
      orderBy: [{ createdAt: "desc" }],
      select: { id: true, role: true, name: true, createdAt: true },
    }),
  ]);

  const gaps = gapsRaw.map((g) =>
    GapSchema.parse({
      ...g,
      resolvedByInternalInputId: g.resolvedByInternalInputId,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }),
  );

  const internalInputs = internalInputsRaw.map((i) => ({
    id: i.id,
    role: i.role,
    name: i.name,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <MetisShell activePath="/gaps" pageTitle="Gaps" issueRoutePrefix={`/issues/${issue.id}`}>
      <GapLedger issueId={issue.id} gaps={gaps} internalInputs={internalInputs} issueOpenGapsCount={issue.openGapsCount} />
    </MetisShell>
  );
}
