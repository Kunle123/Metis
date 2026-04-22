import { NextResponse, type NextRequest } from "next/server";

import { getSessionTokenFromRequest } from "@/lib/auth/session";
import { verifySessionToken } from "@/lib/auth/jwt";

function isApiPath(pathname: string) {
  return pathname.startsWith("/api");
}

function isPublicApi(pathname: string) {
  return pathname.startsWith("/api/auth");
}

function isStaticAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/favicon")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.next();
  }

  const token = getSessionTokenFromRequest(request);
  const session = token ? await verifySessionToken(token) : null;

  if (isApiPath(pathname)) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
