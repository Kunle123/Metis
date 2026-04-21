import { prisma } from "@/lib/db/prisma";

export async function getIssueById(issueId: string) {
  if (!issueId || typeof issueId !== "string") return null;
  return prisma.issue.findUnique({ where: { id: issueId } });
}

