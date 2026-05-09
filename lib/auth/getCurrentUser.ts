import { prisma } from "@/lib/db/prisma";
import { AuthUserSchema, type AuthUser } from "@metis/shared/auth";

import { bridgeClerkUserToLocalUser, readClerkBridgeHintsFromAuth } from "./clerkUserBridge";
import { parseUserRoleOrNull, readVerifiedSessionFromRequest } from "./session";

/**
 * Resolved auth identity for API routes / server utilities.
 *
 * Transitional behaviour (when `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are set):
 * Clerk session wins if Clerk reports a signed-in user; maps to Prisma via `bridgeClerkUserToLocalUser`.
 *
 * Otherwise: legacy verified `metis_session` JWT mapped to existing local `User` rows only.
 */
export async function getCurrentAuthUserFromRequest(request: Request): Promise<AuthUser | null> {
  const clerkHints = await readClerkBridgeHintsFromAuth();
  if (clerkHints) {
    const synced = await bridgeClerkUserToLocalUser(clerkHints.clerkUserId);
    if (!synced) return null;

    const role = parseUserRoleOrNull(synced.role);
    if (!role) return null;

    return AuthUserSchema.parse({ id: synced.id, email: synced.email, role });
  }

  const session = await readVerifiedSessionFromRequest(request);
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  const role = parseUserRoleOrNull(user.role) ?? parseUserRoleOrNull(session.role);
  if (!role) return null;

  return AuthUserSchema.parse({ id: user.id, email: user.email, role });
}
