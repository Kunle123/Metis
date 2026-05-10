import type { Prisma } from "@prisma/client";

export type InternalObservationVisibility = "Organisation" | "Restricted";

export type InternalObservationAuthorshipRow = {
  visibility: string | null | undefined;
  createdByUserId: string | null | undefined;
};

export type ObservationViewer = {
  /** Organisation membership role (`Membership.role`): Admin | User | Viewer */
  membershipRole: string;
  userId: string;
};

/** True when organisation membership carries Admin privileges (not the global Metis User.role field). */
export function organisationMembershipIsAdmin(membershipRole: string): boolean {
  return membershipRole.trim() === "Admin";
}

/**
 * Canonical visibility for policy checks and UI.
 * Legacy free-text rows (including `Internal`) are treated as organisation-wide.
 */
export function normalizeObservationVisibility(raw: string | null | undefined): InternalObservationVisibility {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (v === "Restricted") return "Restricted";
  return "Organisation";
}

export function internalObservationReadableByViewer(viewer: ObservationViewer, row: InternalObservationAuthorshipRow): boolean {
  if (organisationMembershipIsAdmin(viewer.membershipRole)) return true;
  if (normalizeObservationVisibility(row.visibility) !== "Restricted") return true;
  const authorId = row.createdByUserId?.trim() ?? "";
  if (!authorId.length) return false;
  return authorId === viewer.userId;
}

export function prismaWhereInternalInputsVisibleToViewer(
  issueId: string,
  viewer: ObservationViewer,
): Prisma.InternalInputWhereInput {
  if (organisationMembershipIsAdmin(viewer.membershipRole)) {
    return { issueId };
  }
  return {
    issueId,
    OR: [{ NOT: { visibility: "Restricted" } }, { AND: [{ visibility: "Restricted" }, { createdByUserId: viewer.userId }] }],
  };
}
