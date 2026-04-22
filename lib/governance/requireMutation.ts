import { NextResponse } from "next/server";

import { getCurrentAuthUserFromRequest } from "@/lib/auth/getCurrentUser";
import { isMutationRole } from "@/lib/auth/session";

export async function requireMutation(request: Request) {
  const user = await getCurrentAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isMutationRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}
