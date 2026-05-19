import type { Issue } from "@prisma/client";

import { isIssueArchived } from "./issueLifecycle";

export function activeIssueForMetisShell(issue: Pick<Issue, "title" | "severity" | "openGapsCount" | "ownerName" | "updatedAt" | "archivedAt" | "deletedAt">) {
  return {
    title: issue.title,
    severity: issue.severity,
    openGapsCount: issue.openGapsCount,
    ownerName: issue.ownerName,
    updatedAt: issue.updatedAt,
    isArchived: isIssueArchived(issue),
  };
}
