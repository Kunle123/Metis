import type { Issue } from "@prisma/client";

import { createRequestMirroringCookies } from "@/lib/auth/serverCookiesRequest";
import { prisma } from "@/lib/db/prisma";

import type { ActiveOrganisationContext } from "./activeOrganisationContext";
import { resolveActiveOrganisationContext } from "./activeOrganisationContext";

export type LoadedIssuePageContext =
  | { outcome: "unauthorized" }
  | { outcome: "no_membership" }
  | { outcome: "not_found" }
  | { outcome: "ok"; organisationId: string; context: ActiveOrganisationContext; issue: Issue };

/** JWT user + memberships + issue scoped by active organisation. Wrong-org → `not_found` outcome. */
export async function loadIssuePageContext(issueId: string): Promise<LoadedIssuePageContext> {
  const req = await createRequestMirroringCookies(`/issues/${issueId}`);
  const resolved = await resolveActiveOrganisationContext(req);
  if (!resolved.ok) {
    return { outcome: resolved.httpStatus === 401 ? "unauthorized" : "no_membership" };
  }

  const organisationId = resolved.context.organisation.id;

  const issue = await prisma.issue.findFirst({
    where: { id: issueId, organisationId, deletedAt: null },
  });

  if (!issue) return { outcome: "not_found" };

  return {
    outcome: "ok",
    organisationId,
    context: resolved.context,
    issue,
  };
}
