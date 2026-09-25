import "server-only";
import { env } from "@/lib/config/env";
import type { SignInInput } from "@/lib/validation/auth";
import { hashPassword, needsRehash, verifyDecoy, verifyPassword } from "@/server/auth/password";
import { isExpired, sessionExpiry, shouldTouch } from "@/server/auth/session-policy";
import { clearAccountAttempts, consumeLoginAttempt, LOCKOUT } from "@/server/auth/throttle";
import { generateSessionToken, hashSessionToken, isWellFormedToken } from "@/server/auth/tokens";
import { pool } from "@/server/db/pool";
import { log } from "@/server/log";
import * as repo from "@/server/repositories/auth";

export type SessionUser = repo.SessionRecord["user"] & { sessionId: number; expiresAt: Date };

export type RequestMeta = { ip: string | null; userAgent: string | null };

export type SignInResult =
  | { ok: true; token: string; expiresAt: Date; user: { userId: number; role: repo.RoleName } }
  | { ok: false; reason: "INVALID" | "INACTIVE" }
  | { ok: false; reason: "THROTTLED"; retryAfterSeconds: number };

const window = () => ({
  idleHours: env().SESSION_IDLE_HOURS,
  absoluteHours: env().SESSION_ABSOLUTE_HOURS,
});

/** Issues a new session token for a verified member. */
export async function openSession(userId: number, meta: RequestMeta) {
  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = sessionExpiry(now, now, window());
  await repo.insertSession(pool("auth"), {
    userId,
    tokenHash: hashSessionToken(token),
    ip: meta.ip,
    userAgent: meta.userAgent,
    expiresAt,
  });
  return { token, expiresAt };
}

/**
 * Verifies credentials and opens a session. Unknown and wrong both read as
 * INVALID; repeated failures throttle the address and lock the account.
 */
export async function signIn(input: SignInInput, meta: RequestMeta): Promise<SignInResult> {
  const throttle = await consumeLoginAttempt(meta.ip, input.identifier);
  if (!throttle.allowed) {
    return { ok: false, reason: "THROTTLED", retryAfterSeconds: throttle.retryAfterSeconds };
  }

  const db = pool("auth");
  const credential = await repo.findCredential(db, input.identifier);
  const now = Date.now();

  if (credential?.lockedUntil && credential.lockedUntil.getTime() > now) {
    await repo.recordAttempt(db, input.identifier, meta.ip, false);
    return {
      ok: false,
      reason: "THROTTLED",
      retryAfterSeconds: Math.ceil((credential.lockedUntil.getTime() - now) / 1000),
    };
  }

  const verified = credential
    ? await verifyPassword(credential.passwordHash, input.password)
    : await verifyDecoy(input.password);

  if (!credential || !verified) {
    if (credential)
      await repo.recordFailure(db, credential.userId, LOCKOUT.failures, LOCKOUT.minutes);
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

  const session = await openSession(credential.userId, meta);
  await repo.recordLogin(db, credential.userId);
  await repo.recordAttempt(db, input.identifier, meta.ip, true);
  await clearAccountAttempts(input.identifier);
  log.info({ userId: credential.userId, role: credential.role }, "signed in");

  return { ok: true, ...session, user: { userId: credential.userId, role: credential.role } };
}

export type ChangePasswordResult =
  | { ok: true; token: string; expiresAt: Date }
  | { ok: false; reason: "WRONG_PASSWORD" | "SAME_PASSWORD" };

/**
 * Changes the password after checking the current one. The database revokes
 * every session of the account, this one included, and a fresh session is
 * issued so the person stays signed in here only.
 */
export async function changePassword(
  userId: number,
  current: string,
  next: string,
  meta: RequestMeta,
): Promise<ChangePasswordResult> {
  const db = pool("auth");
  const credential = await repo.findCredentialById(db, userId);
  if (!credential || !(await verifyPassword(credential.passwordHash, current))) {
    return { ok: false, reason: "WRONG_PASSWORD" };
  }
  if (await verifyPassword(credential.passwordHash, next))
    return { ok: false, reason: "SAME_PASSWORD" };

  await repo.changePasswordHash(db, userId, await hashPassword(next));
  const session = await openSession(userId, meta);
  log.info({ userId }, "password changed, sessions rotated");
  return { ok: true, ...session };
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
