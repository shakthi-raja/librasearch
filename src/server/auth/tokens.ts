import "server-only";
import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** A 256-bit random token for the cookie. Only its hash is ever stored. */
export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Cheap shape check before any database lookup. */
export function isWellFormedToken(value: string | undefined): value is string {
  return value !== undefined && TOKEN_PATTERN.test(value);
}
