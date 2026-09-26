import { describe, expect, it } from "vitest";
import {
  checkGoogleClaims,
  decodeFlowState,
  encodeFlowState,
  googleAuthorizationUrl,
  pkceChallenge,
  randomToken,
  safeNext,
} from "@/lib/auth/oidc";

describe("pkceChallenge", () => {
  it("matches the RFC 7636 example", async () => {
    expect(await pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
});

describe("randomToken", () => {
  it("is url safe and unique", () => {
    const a = randomToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomToken()).not.toBe(a);
  });
});

describe("googleAuthorizationUrl", () => {
  it("asks for an authorization code with PKCE, state and nonce", () => {
    const url = new URL(
      googleAuthorizationUrl({
        clientId: "client.apps.googleusercontent.com",
        redirectUri: "https://library.example/api/v1/auth/google/callback",
        state: "s".repeat(20),
        nonce: "n".repeat(20),
        challenge: "c".repeat(43),
      }),
    );
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      response_type: "code",
      scope: "openid email profile",
      code_challenge_method: "S256",
      code_challenge: "c".repeat(43),
      state: "s".repeat(20),
      nonce: "n".repeat(20),
    });
  });
});

describe("flow state", () => {
  const state = {
    state: randomToken(),
    nonce: randomToken(),
    verifier: randomToken(48),
    intent: "link" as const,
    next: "/account",
  };

  it("survives the round trip", () => {
    expect(decodeFlowState(encodeFlowState(state))).toEqual(state);
  });

  it("rejects a missing, garbled or incomplete cookie", () => {
    expect(decodeFlowState(undefined)).toBeNull();
    expect(decodeFlowState("not-base64-json")).toBeNull();
    expect(decodeFlowState(encodeFlowState({ ...state, verifier: "short" }))).toBeNull();
  });
});

describe("safeNext", () => {
  it("keeps same-site paths only", () => {
    expect(safeNext("/student")).toBe("/student");
    expect(safeNext("//evil.example")).toBeNull();
    expect(safeNext("/\\evil.example")).toBeNull();
    expect(safeNext("https://evil.example")).toBeNull();
    expect(safeNext(null)).toBeNull();
  });
});

describe("checkGoogleClaims", () => {
  const claims = {
    sub: "1234567890",
    email: "Student@Example.com",
    email_verified: true,
    name: "A Student",
    nonce: "expected",
  };

  it("returns the identity with a lowercase address", () => {
    expect(checkGoogleClaims(claims, "expected")).toEqual({
      ok: true,
      identity: { subject: "1234567890", email: "student@example.com", name: "A Student" },
    });
  });

  it("refuses a replayed token, a missing address and an unverified one", () => {
    expect(checkGoogleClaims(claims, "other")).toEqual({ ok: false, reason: "NONCE" });
    expect(checkGoogleClaims({ ...claims, email: undefined }, "expected")).toEqual({
      ok: false,
      reason: "NO_EMAIL",
    });
    expect(checkGoogleClaims({ ...claims, email_verified: false }, "expected")).toEqual({
      ok: false,
      reason: "UNVERIFIED_EMAIL",
    });
  });
});
