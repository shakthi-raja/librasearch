import { z } from "zod";

/**
 * The parts of the Google OpenID Connect code flow that need no network:
 * PKCE, the authorization URL, the short-lived state cookie and the checks on
 * a verified ID token's claims. Signature, issuer, audience and expiry are
 * verified by the caller with Google's published keys before these run.
 */

export const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A URL-safe random value with the given number of bytes of entropy. */
export function randomToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return base64url(buffer);
}

/** RFC 7636 S256 code challenge for a verifier. */
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export type AuthorizationRequest = {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  challenge: string;
};

export function googleAuthorizationUrl(request: AuthorizationRequest): string {
  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: request.clientId,
    redirect_uri: request.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: request.state,
    nonce: request.nonce,
    code_challenge: request.challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

const stateSchema = z.object({
  state: z.string().min(16),
  nonce: z.string().min(16),
  verifier: z.string().min(43).max(128),
  intent: z.enum(["signin", "link"]),
  next: z.string().nullable(),
});

/** What the browser carries between the redirect to Google and the callback. */
export type FlowState = z.infer<typeof stateSchema>;

export function encodeFlowState(state: FlowState): string {
  return base64url(new TextEncoder().encode(JSON.stringify(state)));
}

export function decodeFlowState(value: string | undefined): FlowState | null {
  if (!value) return null;
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)),
    );
    const parsed = stateSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Only same-site relative paths survive the round trip, so the flow cannot redirect off site. */
export function safeNext(value: string | null | undefined): string | null {
  if (!value?.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  return value;
}

export type GoogleIdentity = { subject: string; email: string; name: string | null };

export type ClaimsCheck =
  | { ok: true; identity: GoogleIdentity }
  | { ok: false; reason: "NONCE" | "NO_EMAIL" | "UNVERIFIED_EMAIL" };

/** Checks what the signature cannot: the nonce we sent, and an address Google has verified. */
export function checkGoogleClaims(claims: Record<string, unknown>, nonce: string): ClaimsCheck {
  if (claims.nonce !== nonce) return { ok: false, reason: "NONCE" };
  if (typeof claims.email !== "string" || typeof claims.sub !== "string" || !claims.sub) {
    return { ok: false, reason: "NO_EMAIL" };
  }
  if (claims.email_verified !== true) return { ok: false, reason: "UNVERIFIED_EMAIL" };
  return {
    ok: true,
    identity: {
      subject: claims.sub,
      email: claims.email.trim().toLowerCase(),
      name: typeof claims.name === "string" ? claims.name : null,
    },
  };
}
