import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sessionFromToken } from "@/server/services/auth";
import {
  googleLinkFor,
  googleSignIn,
  linkGoogle,
  unlinkGoogle,
} from "@/server/services/google-auth";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;
const meta = { ip: null, userAgent: "vitest" };

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

let seq = 0;
const unique = () => `${Date.now()}${++seq}`;
const identity = (email: string, subject = `sub-${unique()}`) => ({
  subject,
  email,
  name: "Google Person",
});

const memberWithEmail = async (role: "STUDENT" | "FACULTY" = "STUDENT") => {
  const email = `google.${unique()}@test.librasearch.local`;
  return { email, userId: await insertUser(db, role, { email }) };
};

describe("googleSignIn", () => {
  it("links on the first sign-in by verified address and opens a session", async () => {
    const { email, userId } = await memberWithEmail();
    const result = await googleSignIn(identity(email), meta);

    expect(result).toMatchObject({ ok: true, user: { userId, role: "STUDENT" } });
    if (!result.ok) return;
    expect((await sessionFromToken(result.token))?.userId).toBe(userId);
    expect((await googleLinkFor(userId))?.email).toBe(email);
  });

  it("finds the member by google subject after the address changes", async () => {
    const { email, userId } = await memberWithEmail("FACULTY");
    const subject = `sub-${unique()}`;
    await googleSignIn(identity(email, subject), meta);

    const later = await googleSignIn(identity(`changed.${unique()}@gmail.com`, subject), meta);
    expect(later).toMatchObject({ ok: true, user: { userId, role: "FACULTY" } });
  });

  it("never creates a member for an unknown address", async () => {
    const result = await googleSignIn(identity(`stranger.${unique()}@gmail.com`), meta);
    expect(result).toEqual({ ok: false, reason: "NO_ACCOUNT" });
  });

  it("refuses a member who is not active", async () => {
    const { email, userId } = await memberWithEmail();
    await db.query("UPDATE users SET status = 'SUSPENDED' WHERE user_id = ?", [userId]);
    expect(await googleSignIn(identity(email), meta)).toEqual({ ok: false, reason: "INACTIVE" });
    expect(await googleLinkFor(userId)).toBeNull();
  });

  it("does not let a second google account take over a linked member", async () => {
    const { email, userId } = await memberWithEmail();
    await linkGoogle(userId, identity(`personal.${unique()}@gmail.com`));
    expect(await googleSignIn(identity(email), meta)).toEqual({
      ok: false,
      reason: "LINKED_ELSEWHERE",
    });
  });

  it("records the sign-in time on the link", async () => {
    const { email, userId } = await memberWithEmail();
    await googleSignIn(identity(email), meta);
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT last_used_at FROM oauth_accounts WHERE user_id = ?",
      [userId],
    );
    expect(rows[0]?.last_used_at).not.toBeNull();
  });
});

describe("linkGoogle", () => {
  it("links any google address to the signed-in member, once", async () => {
    const { userId } = await memberWithEmail();
    const personal = identity(`personal.${unique()}@gmail.com`);
    expect(await linkGoogle(userId, personal)).toEqual({ ok: true });
    expect(await linkGoogle(userId, personal)).toEqual({ ok: false, reason: "ALREADY_LINKED" });
    expect(await linkGoogle(userId, identity(`other.${unique()}@gmail.com`))).toEqual({
      ok: false,
      reason: "ALREADY_LINKED",
    });
  });

  it("refuses a google account that belongs to someone else", async () => {
    const first = await memberWithEmail();
    const second = await memberWithEmail();
    const shared = identity(`shared.${unique()}@gmail.com`);
    await linkGoogle(first.userId, shared);
    expect(await linkGoogle(second.userId, shared)).toEqual({ ok: false, reason: "IN_USE" });
  });

  it("unlinks, after which the address links again", async () => {
    const { email, userId } = await memberWithEmail();
    await googleSignIn(identity(email), meta);
    expect(await unlinkGoogle(userId)).toBe(true);
    expect(await unlinkGoogle(userId)).toBe(false);
    expect(await googleSignIn(identity(email), meta)).toMatchObject({ ok: true });
  });
});
