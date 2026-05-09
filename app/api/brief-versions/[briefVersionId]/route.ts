import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireActiveOrganisationContext } from "@/lib/organisations/activeOrganisationContext";

export async function GET(request: Request, { params }: { params: Promise<{ briefVersionId: string }> }) {
  const ctx = await requireActiveOrganisationContext(request);
  if (ctx instanceof NextResponse) return ctx;

  const { briefVersionId } = await params;
  const briefVersion = await prisma.briefVersion.findFirst({
    where: {
      id: briefVersionId,
      issue: { organisationId: ctx.organisation.id },
    },
  });

  if (!briefVersion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...briefVersion,
    generatedFromIssueUpdatedAt: briefVersion.generatedFromIssueUpdatedAt.toISOString(),
    createdAt: briefVersion.createdAt.toISOString(),
  });
}

