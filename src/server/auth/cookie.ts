import "server-only";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { env } from "@/lib/config/env";

export function sessionCookieName() {
  return env().SESSION_COOKIE_NAME;
}

export function sessionCookie(token: string, expiresAt: Date): ResponseCookie {
  return {
    name: sessionCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: env().NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export function clearedSessionCookie(): ResponseCookie {
  return { ...sessionCookie("", new Date(0)), maxAge: 0 };
}
