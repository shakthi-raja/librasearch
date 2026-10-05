import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { CARD_PREFIX } from "@/lib/circulation/scan";

/** A card QR is good for five minutes, so a photo of it is soon worthless. */
export const CARD_TTL_SECONDS = 300;

const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest().subarray(0, 16).toString("base64url");

export function issueCardToken(universityId: string, secret: string, now = new Date()) {
  const expires = Math.floor(now.getTime() / 1000) + CARD_TTL_SECONDS;
  const payload = `${universityId}.${expires}`;
  return {
    token: `${payload}.${sign(payload, secret)}`,
    qr: `${CARD_PREFIX}${payload}.${sign(payload, secret)}`,
    expiresAt: new Date(expires * 1000),
  };
}

export type CardCheck =
  | { ok: true; universityId: string }
  | { ok: false; reason: "MALFORMED" | "EXPIRED" | "FORGED" };

export function verifyCardToken(token: string, secret: string, now = new Date()): CardCheck {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "MALFORMED" };
  const [universityId, expires, signature] = parts as [string, string, string];
  if (!/^[A-Z0-9]{4,20}$/.test(universityId) || !/^\d{10}$/.test(expires)) {
    return { ok: false, reason: "MALFORMED" };
  }
  const expected = Buffer.from(sign(`${universityId}.${expires}`, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "FORGED" };
  }
  if (Number(expires) * 1000 < now.getTime()) return { ok: false, reason: "EXPIRED" };
  return { ok: true, universityId };
}
