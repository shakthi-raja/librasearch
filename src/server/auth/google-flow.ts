import "server-only";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { env } from "@/lib/config/env";

/** Carries state, nonce and PKCE verifier from the redirect to the callback only. */
export const FLOW_COOKIE = "ls_google_flow";

export function flowCookie(value: string): ResponseCookie {
  return {
    name: FLOW_COOKIE,
    value,
    httpOnly: true,
    // the callback is a top-level navigation from Google, which lax allows
    sameSite: "lax",
    secure: env().NODE_ENV === "production",
    path: "/api/v1/auth/google",
    maxAge: 10 * 60,
  };
}

export function clearedFlowCookie(): ResponseCookie {
  return { ...flowCookie(""), maxAge: 0 };
}
