import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { UserRoleSchema, type UserRole, type AuthUser } from "@metis/shared/auth";

const ALG = "HS256" as const;
const ISS = "metis" as const;
const AUD = "metis-web" as const;

function getSecretKey() {
  const secret = process.env.METIS_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing METIS_SESSION_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: AuthUser, { expiresInSeconds }: { expiresInSeconds: number }) {
  return await new SignJWT({
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer(ISS)
    .setAudience(AUD)
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(getSecretKey());
}

export type VerifiedSession = {
  userId: string;
  email: string;
  role: UserRole;
};

export async function verifySessionToken(token: string): Promise<VerifiedSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: ISS,
      audience: AUD,
      algorithms: [ALG],
    });
    return parseSessionPayload(payload);
  } catch {
    return null;
  }
}

function parseSessionPayload(payload: JWTPayload): VerifiedSession | null {
  if (!payload.sub) return null;
  const email = payload.email;
  const role = UserRoleSchema.safeParse(payload.role);
  if (typeof email !== "string" || !role.success) return null;
  return { userId: payload.sub, email, role: role.data };
}
