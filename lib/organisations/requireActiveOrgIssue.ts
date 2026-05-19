import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

import { requireActiveOrganisationContext } from "./activeOrganisationContext";

/** Authenticated workspace + Issue row constrained to active organisation (`404` if wrong/other org UUID). */
export async function requireActiveOrgIssue(request: Request, issueId: string) {
  const ctx = await requireActiveOrganisationContext(request);
  if (ctx instanceof NextResponse) return ctx;

  const issue = await prisma.issue.findFirst({
    where: { id: issueId, organisationId: ctx.organisation.id, deletedAt: null },
  });

  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return { ctx, issue };
}
