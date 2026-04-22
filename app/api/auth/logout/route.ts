import { NextResponse } from "next/server";

import { buildClearSessionCookieHeader } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true as const });
  res.headers.append("Set-Cookie", buildClearSessionCookieHeader());
  return res;
}
