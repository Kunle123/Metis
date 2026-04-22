import { NextResponse } from "next/server";

import { LoginRequestSchema, LoginResponseSchema, UserRoleSchema } from "@metis/shared/auth";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { buildSetSessionCookieHeader, mintSessionToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = LoginRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const role = UserRoleSchema.safeParse(user.role);
  if (!role.success) {
    return NextResponse.json({ error: "Invalid user role" }, { status: 500 });
  }

  const sessionUser = { id: user.id, email: user.email, role: role.data };
  const token = await mintSessionToken(sessionUser);
  const res = NextResponse.json(LoginResponseSchema.parse({ user: sessionUser }));
  res.headers.append("Set-Cookie", buildSetSessionCookieHeader(token));
  return res;
}
