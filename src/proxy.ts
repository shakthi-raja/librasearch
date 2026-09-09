import { type NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/student", "/faculty", "/admin", "/account"];
// Mirrors SESSION_COOKIE_NAME's default. The proxy only checks presence; the
// session itself, its expiry and the role are verified on the server render.
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "ls_session";

export function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !request.cookies.has(COOKIE)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|webp|ico)$).*)"],
};
