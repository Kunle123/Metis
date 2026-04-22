import { UserRoleSchema, type UserRole, type AuthUser } from "@metis/shared/auth";

import { signSessionToken, verifySessionToken, type VerifiedSession } from "./jwt";

export const SESSION_COOKIE_NAME = "metis_session";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function getSessionTokenFromRequest(request: Request) {
  const raw = request.headers.get("cookie") ?? "";
  const map = Object.fromEntries(
    raw
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const idx = p.indexOf("=");
        if (idx === -1) return [p, ""] as const;
        return [p.slice(0, idx), decodeURIComponent(p.slice(idx + 1))] as const;
      }),
  );
  return map[SESSION_COOKIE_NAME] ?? null;
}

export function buildSetSessionCookieHeader(token: string) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ].filter(Boolean);
  return parts.join("; ");
}

export function buildClearSessionCookieHeader() {
  const parts = [`${SESSION_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0", process.env.NODE_ENV === "production" ? "Secure" : ""].filter(
    Boolean,
  );
  return parts.join("; ");
}

export async function mintSessionToken(user: AuthUser) {
  return await signSessionToken(
    { id: user.id, email: user.email, role: user.role },
    { expiresInSeconds: SESSION_TTL_SECONDS },
  );
}

export async function readVerifiedSessionFromRequest(request: Request): Promise<VerifiedSession | null> {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  return await verifySessionToken(token);
}

export function isMutationRole(role: UserRole) {
  return role === "Operator" || role === "Admin";
}

export function parseUserRoleOrNull(role: string) {
  const parsed = UserRoleSchema.safeParse(role);
  return parsed.success ? parsed.data : null;
}
