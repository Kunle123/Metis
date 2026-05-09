import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { METIS_MEMBERSHIP_ROLE_ADMIN, wouldRemoveLastOrganisationAdmin } from "@/lib/organisations/membershipAdminPolicy";
import { requireActiveOrganisationManageUsersContext } from "@/lib/organisations/requireOrganisationCapability";

export const runtime = "nodejs";

const PatchBodySchema = z.object({
  role: z.enum(["Admin", "User", "Viewer"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  const ctx = await requireActiveOrganisationManageUsersContext(request);
  if (ctx instanceof NextResponse) return ctx;

  const { membershipId } = await params;
  const organisationId = ctx.organisation.id;

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organisationId },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PatchBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const nextRole = parsed.data.role;

  const adminCount = await prisma.membership.count({
    where: { organisationId, role: METIS_MEMBERSHIP_ROLE_ADMIN },
  });

  if (
    wouldRemoveLastOrganisationAdmin({
      targetMembershipCurrentRole: membership.role,
      nextRole,
      isDelete: false,
      totalAdminCount: adminCount,
    })
  ) {
    return NextResponse.json(
      { error: "Cannot change role: this organisation must keep at least one Admin." },
      { status: 403 },
    );
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { role: nextRole },
  });

  return NextResponse.json({ ok: true as const });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  const ctx = await requireActiveOrganisationManageUsersContext(_request);
  if (ctx instanceof NextResponse) return ctx;

  const { membershipId } = await params;
  const organisationId = ctx.organisation.id;

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organisationId },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const adminCount = await prisma.membership.count({
    where: { organisationId, role: METIS_MEMBERSHIP_ROLE_ADMIN },
  });

  if (
    wouldRemoveLastOrganisationAdmin({
      targetMembershipCurrentRole: membership.role,
      isDelete: true,
      totalAdminCount: adminCount,
    })
  ) {
    return NextResponse.json(
      { error: "Cannot remove this member: the organisation must keep at least one Admin." },
      { status: 403 },
    );
  }

  await prisma.membership.delete({ where: { id: membership.id } });

  return NextResponse.json({ ok: true as const });
}
