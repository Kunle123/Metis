import type { Prisma } from "@prisma/client";

export type IssueLedger = "active" | "archived";

export type IssueLifecycleFields = {
  archivedAt: Date | null;
  deletedAt: Date | null;
};

export function isIssueDeleted(issue: IssueLifecycleFields): boolean {
  return issue.deletedAt != null;
}

export function isIssueArchived(issue: IssueLifecycleFields): boolean {
  return !isIssueDeleted(issue) && issue.archivedAt != null;
}

export function isIssueActive(issue: IssueLifecycleFields): boolean {
  return !isIssueDeleted(issue) && issue.archivedAt == null;
}

/** False when archived or soft-deleted. */
export function isIssueWritable(issue: IssueLifecycleFields): boolean {
  return isIssueActive(issue);
}

export function parseIssueLedger(raw: string | null | undefined): IssueLedger {
  return raw === "archived" ? "archived" : "active";
}

export function prismaWhereIssuesForLedger(organisationId: string, ledger: IssueLedger): Prisma.IssueWhereInput {
  if (ledger === "archived") {
    return { organisationId, deletedAt: null, archivedAt: { not: null } };
  }
  return { organisationId, deletedAt: null, archivedAt: null };
}

/** Issue pages and non-deleted API reads. */
export function prismaWhereIssueVisible(organisationId: string, issueId: string): Prisma.IssueWhereInput {
  return { id: issueId, organisationId, deletedAt: null };
}
