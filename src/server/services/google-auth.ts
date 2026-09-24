import "server-only";
import type { GoogleIdentity } from "@/lib/auth/oidc";
import { clearAccountAttempts, consumeLoginAttempt } from "@/server/auth/throttle";
import { pool } from "@/server/db/pool";
import { log } from "@/server/log";
import * as auth from "@/server/repositories/auth";
import * as repo from "@/server/repositories/oauth";
import { openSession, type RequestMeta } from "./auth";

export type GoogleSignInResult =
  | { ok: true; token: string; expiresAt: Date; user: { userId: number; role: auth.RoleName } }
  | { ok: false; reason: "NO_ACCOUNT" | "INACTIVE" | "LINKED_ELSEWHERE" }
  | { ok: false; reason: "THROTTLED"; retryAfterSeconds: number };

const isDuplicate = (error: unknown) => (error as { errno?: number }).errno === 1062;

/**
 * Signs a member in with a Google identity whose signature, audience and
 * verified address have already been checked. The first time, the identity is
 * linked to the member who owns that address; after that the Google subject
 * alone finds them, even if the address changes. Nobody is created here:
 * members come from the library's records.
 */
export async function googleSignIn(
  identity: GoogleIdentity,
  meta: RequestMeta,
): Promise<GoogleSignInResult> {
  const attemptKey = `google:${identity.email}`;
  const throttle = await consumeLoginAttempt(meta.ip, attemptKey);
  if (!throttle.allowed) {
    return { ok: false, reason: "THROTTLED", retryAfterSeconds: throttle.retryAfterSeconds };
  }

  const db = pool("auth");
  let member = await repo.memberBySubject(db, identity.subject);
  if (!member) {
    member = await repo.memberByEmail(db, identity.email);
    if (!member) {
      await auth.recordAttempt(db, attemptKey, meta.ip, false);
      return { ok: false, reason: "NO_ACCOUNT" };
    }
    // a member links one Google account; a different one is not taken over
    if (await repo.googleLinkFor(db, member.userId)) {
      await auth.recordAttempt(db, attemptKey, meta.ip, false);
      return { ok: false, reason: "LINKED_ELSEWHERE" };
    }
    if (member.status === "ACTIVE") {
      await repo.insertGoogleLink(db, member.userId, identity.subject, identity.email);
    }
  }

  if (member.status !== "ACTIVE") {
    await auth.recordAttempt(db, attemptKey, meta.ip, false);
    return { ok: false, reason: "INACTIVE" };
  }

  await repo.touchGoogleLink(db, identity.subject);
  const session = await openSession(member.userId, meta);
  await auth.recordLogin(db, member.userId);
  await auth.recordAttempt(db, attemptKey, meta.ip, true);
  await clearAccountAttempts(attemptKey);
  log.info({ userId: member.userId, role: member.role }, "signed in with google");

  return { ok: true, ...session, user: { userId: member.userId, role: member.role } };
}

export type LinkResult = { ok: true } | { ok: false; reason: "ALREADY_LINKED" | "IN_USE" };

/** Links Google to the signed-in member, whatever address the Google account uses. */
export async function linkGoogle(userId: number, identity: GoogleIdentity): Promise<LinkResult> {
  const db = pool("auth");
  const owner = await repo.memberBySubject(db, identity.subject);
  if (owner) return { ok: false, reason: owner.userId === userId ? "ALREADY_LINKED" : "IN_USE" };
  if (await repo.googleLinkFor(db, userId)) return { ok: false, reason: "ALREADY_LINKED" };
  try {
    await repo.insertGoogleLink(db, userId, identity.subject, identity.email);
  } catch (error) {
    if (isDuplicate(error)) return { ok: false, reason: "IN_USE" };
    throw error;
  }
  log.info({ userId }, "google account linked");
  return { ok: true };
}

export async function unlinkGoogle(userId: number): Promise<boolean> {
  const removed = await repo.deleteGoogleLink(pool("auth"), userId);
  if (removed) log.info({ userId }, "google account unlinked");
  return removed;
}

export async function googleLinkFor(userId: number) {
  return repo.googleLinkFor(pool("auth"), userId);
}
