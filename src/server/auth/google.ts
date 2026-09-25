import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { GOOGLE_ISSUERS, GOOGLE_JWKS_URL, GOOGLE_TOKEN_URL } from "@/lib/auth/oidc";
import { env } from "@/lib/config/env";

export type GoogleConfig = { clientId: string; clientSecret: string; redirectUri: string };

/** Null when the owner has not configured an OAuth client; the button is hidden then. */
export function googleConfig(): GoogleConfig | null {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL } = env();
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;
  return {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: new URL("/api/v1/auth/google/callback", APP_URL).toString(),
  };
}

// jose caches the key set and refetches it when Google rotates keys
const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

/** Trades the authorization code for an ID token, proving we started the flow. */
export async function exchangeCode(
  config: GoogleConfig,
  code: string,
  verifier: string,
): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`google token endpoint answered ${response.status}`);
  const body = (await response.json()) as { id_token?: unknown };
  if (typeof body.id_token !== "string") throw new Error("google returned no id token");
  return body.id_token;
}

/** Signature, issuer, audience and expiry. The nonce and address are checked by the caller. */
export async function verifyIdToken(config: GoogleConfig, idToken: string) {
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: GOOGLE_ISSUERS,
    audience: config.clientId,
    clockTolerance: 30,
  });
  return payload as Record<string, unknown>;
}
