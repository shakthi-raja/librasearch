import "server-only";
import { env } from "@/lib/config/env";
import type { SignInInput } from "@/lib/validation/auth";
import { hashPassword, needsRehash, verifyDecoy, verifyPassword } from "@/server/auth/password";
import { isExpired, sessionExpiry, shouldTouch } from "@/server/auth/session-policy";
import { generateSessionToken, hashSessionToken, isWellFormedToken } from "@/server/auth/tokens";
import { pool } from "@/server/db/pool";
import { log } from "@/server/log";
import * as repo from "@/server/repositories/auth";

export type SessionUser = repo.SessionRecord["user"] & { sessionId: number; expiresAt: Date };

export type RequestMeta = { ip: string | null; userAgent: string | null };

export type SignInResult =
  | { ok: true; token: string; expiresAt: Date; user: { userId: number; role: repo.RoleName } }
  | { ok: false; reason: "INVALID" | "INACTIVE" };

const window = () => ({
  idleHours: env().SESSION_IDLE_HOURS,
  absoluteHours: env().SESSION_ABSOLUTE_HOURS,
});

/** Verifies credentials and opens a session. Unknown and wrong both read as INVALID. */
export async function signIn(input: SignInInput, meta: RequestMeta): Promise<SignInResult> {
  const db = pool("auth");
  const credential = await repo.findCredential(db, input.identifier);

  const verified = credential
    ? await verifyPassword(credential.passwordHash, input.password)
    : await verifyDecoy(input.password);

  if (!credential || !verified) {
    await repo.recordAttempt(db, input.identifier, meta.ip, false);
    return { ok: false, reason: "INVALID" };
  }
  if (credential.status !== "ACTIVE") {
    await repo.recordAttempt(db, input.identifier, meta.ip, false);
    return { ok: false, reason: "INACTIVE" };
  }

  if (needsRehash(credential.passwordHash)) {
    await repo.replacePasswordHash(db, credential.userId, await hashPassword(input.password));
  }

  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = sessionExpiry(now, now, window());
  await repo.insertSession(db, {
    userId: credential.userId,
    tokenHash: hashSessionToken(token),
    ip: meta.ip,
    userAgent: meta.userAgent,
    expiresAt,
  });
  await repo.recordLogin(db, credential.userId);
  await repo.recordAttempt(db, input.identifier, meta.ip, true);
  log.info({ userId: credential.userId, role: credential.role }, "signed in");

  return { ok: true, token, expiresAt, user: { userId: credential.userId, role: credential.role } };
}

/** Resolves a cookie token to its user, sliding the idle window when due. */
export async function sessionFromToken(token: string | undefined): Promise<SessionUser | null> {
  if (!isWellFormedToken(token)) return null;
  const db = pool("auth");
  const session = await repo.findSession(db, hashSessionToken(token));
  const now = new Date();
  if (!session || isExpired(session.expiresAt, session.revokedAt, now)) return null;
  if (session.user.status !== "ACTIVE") return null;

  let expiresAt = session.expiresAt;
  if (shouldTouch(session.lastSeenAt, now, window())) {
    expiresAt = sessionExpiry(session.createdAt, now, window());
    await repo.touchSession(db, session.sessionId, expiresAt);
  }
  return { ...session.user, sessionId: session.sessionId, expiresAt };
}

export async function signOut(token: string | undefined) {
  if (!isWellFormedToken(token)) return;
  await repo.revokeSession(pool("auth"), hashSessionToken(token));
}
