import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { MetisShell } from "@/components/MetisShell";
import { internalInputDbRowToWire } from "@/lib/internalInputs/internalInputWireFormat";

import { InternalInputWorkspace } from "./internal-input-workspace";

export const dynamic = "force-dynamic";

export default async function IssueInternalInputPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const issue = await getIssueById(issueId);
  if (!issue) notFound();

  const inputsRaw = await prisma.internalInput.findMany({
    where: { issueId: issue.id },
    orderBy: [{ createdAt: "desc" }],
  });

  const inputs = inputsRaw
    .map((i) => internalInputDbRowToWire(i))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <MetisShell
      activePath="/input"
      pageTitle="Internal observations"
      issueRoutePrefix={`/issues/${issue.id}`}
      activeIssue={{
        title: issue.title,
        severity: issue.severity,
        openGapsCount: issue.openGapsCount,
        ownerName: issue.ownerName,
        updatedAt: issue.updatedAt,
      }}
    >
      <InternalInputWorkspace issueId={issue.id} inputs={inputs} />
    </MetisShell>
  );
}
