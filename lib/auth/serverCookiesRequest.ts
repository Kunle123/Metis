import { cookies, headers } from "next/headers";

/**
 * Build a synthetic `Request` that carries cookies from Next server components/route handlers so
 * `getCurrentAuthUserFromRequest` resolves the logged-in User from the JWT session cookie.
 */
export async function createRequestMirroringCookies(pathname = "/"): Promise<Request> {
  const jar = await cookies();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const proto =
    process.env.NODE_ENV === "production" ? (h.get("x-forwarded-proto") ?? "https") : (h.get("x-forwarded-proto") ?? "http");
  const cookieHeader =
    jar
      .getAll()
      .map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`)
      .join("; ") || undefined;
  const hdrs = new Headers();
  if (cookieHeader) hdrs.set("cookie", cookieHeader);
  return new Request(`${proto}://${host}${pathname}`, { headers: hdrs });
}
