import { prisma } from "@/lib/db/prisma";

export async function getIssueForOrganisation(issueId: string, organisationId: string) {
  if (!issueId || typeof issueId !== "string") return null;
  return prisma.issue.findFirst({
    where: { id: issueId, organisationId },
  });
}

