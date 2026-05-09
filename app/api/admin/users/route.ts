import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireActiveOrganisationManageUsersContext } from "@/lib/organisations/requireOrganisationCapability";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ctx = await requireActiveOrganisationManageUsersContext(request);
  if (ctx instanceof NextResponse) return ctx;

  const organisationId = ctx.organisation.id;

  const memberships = await prisma.membership.findMany({
    where: { organisationId },
    include: {
      user: { select: { id: true, email: true, clerkUserId: true, createdAt: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    organisation: {
      id: ctx.organisation.id,
      name: ctx.organisation.name,
      slug: ctx.organisation.slug,
    },
    currentUserId: ctx.user.id,
    members: memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      email: m.user.email,
      displayName: m.user.email,
      role: m.role,
      clerkLinked: Boolean(m.user.clerkUserId),
      membershipCreatedAt: m.createdAt.toISOString(),
      membershipUpdatedAt: m.updatedAt.toISOString(),
      userCreatedAt: m.user.createdAt.toISOString(),
    })),
  });
}
