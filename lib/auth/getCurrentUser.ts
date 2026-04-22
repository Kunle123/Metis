import { prisma } from "@/lib/db/prisma";
import { AuthUserSchema, type AuthUser } from "@metis/shared/auth";

import { parseUserRoleOrNull, readVerifiedSessionFromRequest } from "./session";

export async function getCurrentAuthUserFromRequest(request: Request): Promise<AuthUser | null> {
  const session = await readVerifiedSessionFromRequest(request);
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  const role = parseUserRoleOrNull(user.role) ?? parseUserRoleOrNull(session.role);
  if (!role) return null;

  return AuthUserSchema.parse({ id: user.id, email: user.email, role });
}
