/** Default workspace id (`slug=demo`). Keep in sync with migration `20260509154500_add_organisation_membership`. */
export const DEMO_ORGANISATION_ID = "00000000-0000-4000-a000-000000000001";

export const DEMO_ORGANISATION_SLUG = "demo";

/** Maps persisted global `User.role` to org-scoped `Membership.role` (Operator → User); unknown roles default to Viewer. */
export function membershipRoleFromGlobalUserRole(globalRole: string): string {
  switch (globalRole) {
    case "Admin":
      return "Admin";
    case "Operator":
      return "User";
    case "Viewer":
      return "Viewer";
    default:
      return "Viewer";
  }
}
