import type { Route } from "next";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { checkGoogleClaims, decodeFlowState } from "@/lib/auth/oidc";
import { sessionCookie } from "@/server/auth/cookie";
import { currentUser, HOME_BY_ROLE, requestMeta } from "@/server/auth/current";
import { exchangeCode, googleConfig, verifyIdToken } from "@/server/auth/google";
import { clearedFlowCookie, FLOW_COOKIE } from "@/server/auth/google-flow";
import { log } from "@/server/log";
import { googleSignIn, linkGoogle } from "@/server/services/google-auth";

const SIGN_IN_ERRORS = {
  NO_ACCOUNT: "google_no_account",
  INACTIVE: "google_inactive",
  LINKED_ELSEWHERE: "google_linked_elsewhere",
  THROTTLED: "google_throttled",
} as const;

const LINK_RESULTS = { ALREADY_LINKED: "already", IN_USE: "in_use" } as const;

/** Google sends the browser back here with a code, or with an error if the person cancelled. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const flow = decodeFlowState(request.cookies.get(FLOW_COOKIE)?.value);
  const failTo = flow?.intent === "link" ? "/account?google=failed" : "/login?error=google_failed";

  const finish = (path: string, cookie?: ResponseCookie) => {
    const response = NextResponse.redirect(new URL(path, request.url));
    response.cookies.set(clearedFlowCookie());
    if (cookie) response.cookies.set(cookie);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  const config = googleConfig();
  const code = params.get("code");
  if (!config || !flow) return finish("/login?error=google_failed");
  if (params.get("error")) {
    return finish(
      flow.intent === "link" ? "/account?google=cancelled" : "/login?error=google_cancelled",
    );
  }
  // the state ties this callback to the browser that started the flow
  if (!code || params.get("state") !== flow.state) return finish(failTo);

  let claims: Record<string, unknown>;
  try {
    claims = await verifyIdToken(config, await exchangeCode(config, code, flow.verifier));
  } catch (error) {
    log.warn({ err: error }, "google sign-in could not be verified");
    return finish(failTo);
  }

  const checked = checkGoogleClaims(claims, flow.nonce);
  if (!checked.ok) {
    log.warn({ reason: checked.reason }, "google identity refused");
    return finish(
      checked.reason === "UNVERIFIED_EMAIL" && flow.intent === "signin"
        ? "/login?error=google_unverified"
        : failTo,
    );
  }

  if (flow.intent === "link") {
    const user = await currentUser();
    if (!user) return finish("/login?next=/account");
    const linked = await linkGoogle(user.userId, checked.identity);
    return finish(`/account?google=${linked.ok ? "linked" : LINK_RESULTS[linked.reason]}`);
  }

  const result = await googleSignIn(checked.identity, await requestMeta());
  if (!result.ok) return finish(`/login?error=${SIGN_IN_ERRORS[result.reason]}`);
  return finish(
    flow.next ?? (HOME_BY_ROLE[result.user.role] as Route),
    sessionCookie(result.token, result.expiresAt),
  );
}
