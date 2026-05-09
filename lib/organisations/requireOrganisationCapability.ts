import { NextResponse } from "next/server";

import type { ActiveOrganisationContext } from "./activeOrganisationContext";
import { requireActiveOrganisationContext } from "./activeOrganisationContext";
import { organisationMembershipAllowsCapability, type OrganisationCapability } from "./orgCapabilities";

/**
 * Active org context plus membership role check. Does not use global `User.role`.
 * 401/403 from missing auth or no membership come from `requireActiveOrganisationContext`.
 * Viewer (or other read-only roles) → 403 Forbidden.
 */
export async function requireActiveOrganisationCapability(
  request: Request,
  capability: OrganisationCapability,
): Promise<ActiveOrganisationContext | NextResponse> {
  const ctx = await requireActiveOrganisationContext(request);
  if (ctx instanceof NextResponse) return ctx;
  if (!organisationMembershipAllowsCapability(ctx.membership.role, capability)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return ctx;
}

export async function requireActiveOrganisationWriteContext(
  request: Request,
): Promise<ActiveOrganisationContext | NextResponse> {
  return requireActiveOrganisationCapability(request, "write");
}

/** Alias for mutation handlers (membership must allow `write`). */
export const requireOrgMutation = requireActiveOrganisationWriteContext;

export async function requireActiveOrganisationManageUsersContext(
  request: Request,
): Promise<ActiveOrganisationContext | NextResponse> {
  return requireActiveOrganisationCapability(request, "manage_users");
}
