import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { InternalInputSchema } from "@metis/shared/internalInput";
import { MetisShell } from "@/components/MetisShell";

import { InternalInputWorkspace } from "./internal-input-workspace";

export const dynamic = "force-dynamic";

const INTERNAL_INPUT_CONFIDENCE_VALUES = new Set(["Confirmed", "Likely", "Unclear", "Needs validation"] as const);

function normaliseConfidence(value: unknown): "Confirmed" | "Likely" | "Unclear" | "Needs validation" {
  if (typeof value === "string" && INTERNAL_INPUT_CONFIDENCE_VALUES.has(value as any)) {
    return value as any;
  }
  return "Unclear";
}

export default async function IssueInternalInputPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const issue = await getIssueById(issueId);
  if (!issue) notFound();

  const inputsRaw = await prisma.internalInput.findMany({
    where: { issueId: issue.id },
    orderBy: [{ createdAt: "desc" }],
  });

  const inputs = inputsRaw
    .map((i) => {
      const candidate = {
        id: i.id,
        issueId: i.issueId,
        observationNumber: i.observationNumber,
        role: i.role ?? "",
        name: i.name ?? "",
        response: i.response ?? "",
        confidence: normaliseConfidence((i as any).confidence),
        excludedFromBrief: (i as any).excludedFromBrief ?? false,
        linkedSection: i.linkedSection ?? null,
        visibility: (i as any).visibility ?? null,
        timestampLabel: (i as any).timestampLabel ?? null,
        createdAt: i.createdAt.toISOString(),
      };

      const parsed = InternalInputSchema.safeParse(candidate);
      if (!parsed.success) {
        console.error("Skipping malformed internal input record", {
          id: i.id,
          issues: parsed.error.issues,
        });
        return null;
      }
      return parsed.data;
    })
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
