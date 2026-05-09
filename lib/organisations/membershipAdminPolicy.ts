export const METIS_MEMBERSHIP_ROLE_ADMIN = "Admin";

/**
 * True when applying this change would leave the organisation with **zero** Admins.
 * Call with `totalAdminCount` from `Membership` where `role === Admin` for the organisation.
 */
export function wouldRemoveLastOrganisationAdmin(params: {
  targetMembershipCurrentRole: string;
  /** New role when patching; ignored when `isDelete`. */
  nextRole?: string | null;
  isDelete: boolean;
  totalAdminCount: number;
}): boolean {
  if (params.targetMembershipCurrentRole !== METIS_MEMBERSHIP_ROLE_ADMIN) return false;
  if (params.totalAdminCount !== 1) return false;
  if (params.isDelete) return true;
  return params.nextRole != null && params.nextRole !== METIS_MEMBERSHIP_ROLE_ADMIN;
}
