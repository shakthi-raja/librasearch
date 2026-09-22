import { type NextRequest, NextResponse } from "next/server";
import { newNonce, securityHeaders } from "@/server/http/security-headers";

const PROTECTED = ["/student", "/faculty", "/admin", "/account"];
// Mirrors SESSION_COOKIE_NAME's default. The proxy only checks presence; the
// session itself, its expiry and the role are verified on the server render.
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "ls_session";

export function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const nonce = newNonce();
  const security = securityHeaders({ nonce, production: process.env.NODE_ENV === "production" });
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  headers.set("x-nonce", nonce);
  // Next.js reads the nonce for its own inline scripts from the request policy
  headers.set("Content-Security-Policy", security["Content-Security-Policy"] as string);

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !request.cookies.has(COOKIE)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return withHeaders(NextResponse.redirect(login), security, requestId);
  }

  return withHeaders(NextResponse.next({ request: { headers } }), security, requestId);
}

function withHeaders(response: NextResponse, security: Record<string, string>, requestId: string) {
  for (const [name, value] of Object.entries(security)) response.headers.set(name, value);
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|webp|ico)$).*)"],
};
