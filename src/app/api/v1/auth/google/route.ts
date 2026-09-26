import { type NextRequest, NextResponse } from "next/server";
import {
  encodeFlowState,
  googleAuthorizationUrl,
  pkceChallenge,
  randomToken,
  safeNext,
} from "@/lib/auth/oidc";
import { currentUser } from "@/server/auth/current";
import { googleConfig } from "@/server/auth/google";
import { flowCookie } from "@/server/auth/google-flow";

/** Starts Google sign-in, or linking when ?intent=link and someone is signed in. */
export async function GET(request: NextRequest) {
  const config = googleConfig();
  const intent = request.nextUrl.searchParams.get("intent") === "link" ? "link" : "signin";
  const next = safeNext(request.nextUrl.searchParams.get("next"));

  if (!config) {
    return NextResponse.redirect(new URL("/login?error=google_unavailable", request.url));
  }
  if (intent === "link" && !(await currentUser())) {
    return NextResponse.redirect(new URL("/login?next=/account", request.url));
  }

  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken(48);
  const response = NextResponse.redirect(
    googleAuthorizationUrl({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      state,
      nonce,
      challenge: await pkceChallenge(verifier),
    }),
  );
  response.cookies.set(flowCookie(encodeFlowState({ state, nonce, verifier, intent, next })));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
