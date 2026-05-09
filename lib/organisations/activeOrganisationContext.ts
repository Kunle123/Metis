import { NextResponse } from "next/server";
import type { Membership, Organisation } from "@prisma/client";

import { getCurrentAuthUserFromRequest } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import type { AuthUser } from "@metis/shared/auth";

import { DEMO_ORGANISATION_ID } from "./demoOrganisation";

export type MembershipWithOrganisation = Membership & {
  organisation: Organisation;
};

export type ActiveOrganisationContext = {
  user: AuthUser;
  organisation: Organisation;
  membership: MembershipWithOrganisation;
  /** Org-level role from Membership (Admin | User | Viewer). */
  role: string;
};

function pickMembership(memberships: MembershipWithOrganisation[]): MembershipWithOrganisation {
  if (memberships.length === 1) return memberships[0]!;

  const demoMembership = memberships.find((m) => m.organisationId === DEMO_ORGANISATION_ID);
  if (demoMembership) return demoMembership;

  return [...memberships].sort((a, b) => {
    const byName = a.organisation.name.localeCompare(b.organisation.name);
    if (byName !== 0) return byName;
    return a.createdAt.getTime() - b.createdAt.getTime();
  })[0]!;
}

export type ResolveActiveOrganisationContextResult =
  | { ok: true; context: ActiveOrganisationContext }
  | { ok: false; httpStatus: 401 | 403; error: string };

export async function resolveActiveOrganisationContext(request: Request): Promise<ResolveActiveOrganisationContextResult> {
  const user = await getCurrentAuthUserFromRequest(request);
  if (!user) {
    return { ok: false, httpStatus: 401, error: "Unauthorized" };
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { organisation: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    return { ok: false, httpStatus: 403, error: "No organisation membership" };
  }

  const picked = pickMembership(memberships);
  return {
    ok: true,
    context: {
      user,
      organisation: picked.organisation,
      membership: picked,
      role: picked.role,
    },
  };
}

export async function requireActiveOrganisationContext(
  request: Request,
): Promise<ActiveOrganisationContext | NextResponse> {
  const resolved = await resolveActiveOrganisationContext(request);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.httpStatus });
  }
  return resolved.context;
}
