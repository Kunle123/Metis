/**
 * Organisation-scoped permission model (Membership.role + capability keys).
 *
 * Today:
 * - `write`: Admin and User may mutate org data; Viewer is read-only.
 *
 * Future extension points (not enforced yet):
 * - `manage_users`: Admin only
 * - observation visibility / sensitivity: TBD
 * - `export`: may allow User+Admin only or mirror `write`
 */
export type OrganisationCapability = "write";

const WRITE_ROLES = new Set<string>(["Admin", "User"]);

const CAPABILITY_CHECKS: Record<OrganisationCapability, (membershipRole: string) => boolean> = {
  write: (r) => WRITE_ROLES.has(r),
};

export function organisationMembershipAllowsCapability(
  membershipRole: string,
  capability: OrganisationCapability,
): boolean {
  return CAPABILITY_CHECKS[capability](membershipRole);
}

/** Convenience for routes that only need the default write matrix. */
export function membershipAllowsOrgWrite(membershipRole: string): boolean {
  return organisationMembershipAllowsCapability(membershipRole, "write");
}
