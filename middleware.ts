import { clerkMiddleware, type ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { isMetisClerkEnabled } from "@/lib/auth/clerkEnv";
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

function isAuthUiPublicPath(pathname: string) {
  if (pathname === "/login") return true;
  if (pathname.startsWith("/sign-in")) return true;
  if (pathname.startsWith("/sign-up")) return true;
  if (pathname === "/sso-callback" || pathname.startsWith("/sso-callback/")) return true;
  return false;
}

async function legacySessionUserId(request: NextRequest): Promise<string | null> {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  const session = await verifySessionToken(token);
  return session?.userId ?? null;
}

async function clerkMiddlewareUserId(authFn: ClerkMiddlewareAuth): Promise<string | null> {
  try {
    const snap = await Promise.resolve(
      (authFn as unknown as () => Promise<{ userId: string | null }> | { userId: string | null })(),
    );
    return snap.userId ?? null;
  } catch {
    return null;
  }
}

async function metisClerkHybrid(clerkAuth: ClerkMiddlewareAuth, request: NextRequest, _evt: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (isAuthUiPublicPath(pathname)) {
    return NextResponse.next();
  }

  const clerkUid = await clerkMiddlewareUserId(clerkAuth);
  const legacyUid = clerkUid ? null : await legacySessionUserId(request);
  const session = Boolean(clerkUid) || Boolean(legacyUid);

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

async function legacyOnlyMiddleware(request: NextRequest, _evt?: NextFetchEvent) {
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

export default isMetisClerkEnabled() ? clerkMiddleware(metisClerkHybrid) : legacyOnlyMiddleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
