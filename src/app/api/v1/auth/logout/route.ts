import { NextResponse } from "next/server";
import { clearedSessionCookie, sessionCookieName } from "@/server/auth/cookie";
import { route } from "@/server/http/handler";
import { signOut } from "@/server/services/auth";

export const POST = route(async (request) => {
  await signOut(request.cookies.get(sessionCookieName())?.value);
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(clearedSessionCookie());
  return response;
});
