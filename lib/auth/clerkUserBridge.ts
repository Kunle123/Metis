import { auth, clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db/prisma";
import type { UserRole } from "@metis/shared/auth";

import { isMetisClerkEnabled } from "./clerkEnv";

export type ClerkBridgeHints = {
  clerkUserId: string;
  /** Clerk Organisation id when an org is active in the Clerk session; matches `Organisation.clerkOrgId`. */
  clerkOrgId: string | null;
};

type ClerkAuthLike = {
  userId: string | null;
  orgId?: string | null;
};

/**
 * Clerk-only hints for org resolution; does not touch Prisma.
 * When Clerk is disabled, returns null without calling Clerk.
 */
export async function readClerkBridgeHintsFromAuth(): Promise<ClerkBridgeHints | null> {
  if (!isMetisClerkEnabled()) return null;
  try {
    const a = (await auth()) as ClerkAuthLike;
    if (!a.userId) return null;
    return { clerkUserId: a.userId, clerkOrgId: a.orgId ?? null };
  } catch {
    return null;
  }
}

function primaryEmailFromClerk(clerkLike: {
  primaryEmailAddressId?: string | null;
  emailAddresses?: { id?: string; emailAddress?: string }[];
}): string | null {
  const emails = clerkLike.emailAddresses ?? [];
  const primaryId = clerkLike.primaryEmailAddressId;
  const primary =
    (primaryId && emails.find((e) => e.id === primaryId)?.emailAddress) ??
    emails.find((e) => typeof e.emailAddress === "string" && e.emailAddress.length)?.emailAddress;
  if (!primary || typeof primary !== "string") return null;
  return primary.trim().toLowerCase();
}

/**
 * JIT map Clerk identity → persisted `User` (no local password for Clerk-only accounts).
 * Global `User.role` defaults to Viewer until changed in admin / seed flows; product writes use `Membership.role`.
 */
export async function bridgeClerkUserToLocalUser(clerkUserId: string): Promise<{
  id: string;
  email: string;
  role: string;
} | null> {
  if (!clerkUserId) return null;

  const linked = await prisma.user.findUnique({ where: { clerkUserId }, select: { id: true, email: true, role: true } });
  if (linked) return linked;

  let email: string;
  try {
    const clerk = await clerkClient();
    const cu = await clerk.users.getUser(clerkUserId);
    const extracted = primaryEmailFromClerk({
      primaryEmailAddressId: cu.primaryEmailAddressId,
      emailAddresses: cu.emailAddresses?.map((e) => ({
        id: e.id ?? undefined,
        emailAddress: e.emailAddress ?? undefined,
      })),
    });
    if (!extracted) return null;
    email = extracted;
  } catch {
    return null;
  }

  const byEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, clerkUserId: true },
  });
  if (byEmail) {
    if (byEmail.clerkUserId !== clerkUserId) {
      await prisma.user.update({
        where: { id: byEmail.id },
        data: { clerkUserId },
      });
    }
    return { id: byEmail.id, email: byEmail.email, role: byEmail.role };
  }

  const defaultRoleForJit: UserRole = "Viewer";
  const created = await prisma.user.create({
    data: {
      email,
      clerkUserId,
      passwordHash: null,
      role: defaultRoleForJit,
    },
    select: { id: true, email: true, role: true },
  });
  return created;
}
