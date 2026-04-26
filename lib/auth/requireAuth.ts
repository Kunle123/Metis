import { NextResponse } from "next/server";

import { getCurrentAuthUserFromRequest } from "@/lib/auth/getCurrentUser";

export async function requireAuth(request: Request) {
  const user = await getCurrentAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

