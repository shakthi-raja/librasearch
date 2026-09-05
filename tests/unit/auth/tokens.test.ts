import { describe, expect, it } from "vitest";
import { generateSessionToken, hashSessionToken, isWellFormedToken } from "@/server/auth/tokens";

describe("session tokens", () => {
  it("are 256-bit base64url strings", () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
  });

  it("do not repeat", () => {
    const tokens = new Set(Array.from({ length: 1000 }, generateSessionToken));
    expect(tokens.size).toBe(1000);
  });

  it("hash to a stable 64-character hex digest that hides the token", () => {
    const token = generateSessionToken();
    const digest = hashSessionToken(token);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken(token)).toBe(digest);
    expect(digest).not.toContain(token);
  });

  it.each([
    [undefined, false],
    ["", false],
    ["short", false],
    ["a".repeat(43), true],
    [`${"a".repeat(42)}=`, false],
    [`${"a".repeat(42)}/`, false],
  ])("checks the shape of %s", (value, expected) => {
    expect(isWellFormedToken(value)).toBe(expected);
  });
});
