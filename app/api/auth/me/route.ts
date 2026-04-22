import { NextResponse } from "next/server";

import { getCurrentAuthUserFromRequest } from "@/lib/auth/getCurrentUser";
import { MeResponseSchema } from "@metis/shared/auth";

export async function GET(request: Request) {
  const user = await getCurrentAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(MeResponseSchema.parse({ user }));
}
