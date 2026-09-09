import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@/server/auth/password";
import { hashSessionToken } from "@/server/auth/tokens";
import { closePools } from "@/server/db/pool";
import { redis, redisReady } from "@/server/redis";
import { changePassword, sessionFromToken, signIn } from "@/server/services/auth";
import { adminConnection } from "../support/db";
import { insertUser, roleId } from "../support/fixtures";

const PASSWORD = "shelf mark 42";
let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
  // counters go to redis from the first attempt rather than the cold-start fallback
  await redisReady();
});

afterAll(async () => {
  await closePools();
  redis().disconnect();
  await db.end();
});

let ipCounter = 0;
const meta = () => ({ ip: `198.51.100.${++ipCounter}`, userAgent: "vitest" });

let memberCounter = 0;

async function member() {
  // explicit identifiers keep this suite independent of fixture counters
  const tag = `${Date.now().toString(36).toUpperCase()}${++memberCounter}`;
  const userId = await insertUser(db, "STUDENT", {
    universityId: `HRD${tag}`.slice(0, 20),
    email: `hardening.${tag.toLowerCase()}@test.librasearch.local`,
  });
  await db.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [
    await hashPassword(PASSWORD),
    userId,
  ]);
  const [rows] = await db.query<RowDataPacket[]>("SELECT email FROM users WHERE user_id = ?", [
    userId,
  ]);
  return { userId, email: String(rows[0]?.email) };
}

async function signedIn(email: string) {
  const result = await signIn({ identifier: email, password: PASSWORD }, meta());
  if (!result.ok) throw new Error(`sign in failed: ${result.reason}`);
  return result;
}

const revoked = async (token: string) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT revoked_at FROM auth_sessions WHERE token_hash = ?",
    [hashSessionToken(token)],
  );
  return rows[0]?.revoked_at !== null;
};

describe("account lockout", () => {
  it("locks after five wrong passwords, even for the right one", async () => {
    const { email } = await member();
    for (let i = 0; i < 5; i++) {
      await expect(
        signIn({ identifier: email, password: "wrong password 1" }, meta()),
      ).resolves.toMatchObject({
        reason: "INVALID",
      });
    }
    const locked = await signIn({ identifier: email, password: PASSWORD }, meta());
    expect(locked).toMatchObject({ ok: false, reason: "THROTTLED" });
    if (!locked.ok && locked.reason === "THROTTLED")
      expect(locked.retryAfterSeconds).toBeGreaterThan(14 * 60);
  });

  it("forgets earlier failures after a successful sign-in", async () => {
    const { email, userId } = await member();
    for (let i = 0; i < 4; i++)
      await signIn({ identifier: email, password: "wrong password 1" }, meta());
    await signedIn(email);
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT failed_logins, locked_until FROM users WHERE user_id = ?",
      [userId],
    );
    expect(rows[0]).toEqual({ failed_logins: 0, locked_until: null });
  });
});

describe("rate limiting", () => {
  it("throttles one identifier hammered from many addresses", async () => {
    const identifier = "nobody.at.all@test.librasearch.local";
    const results = [];
    for (let i = 0; i < 11; i++) results.push(await signIn({ identifier, password: "x" }, meta()));
    expect(results.slice(0, 10).every((r) => !r.ok && r.reason === "INVALID")).toBe(true);
    expect(results[10]).toMatchObject({ ok: false, reason: "THROTTLED" });
  });
});

describe("password change", () => {
  it("needs the current password and a new one", async () => {
    const { userId } = await member();
    await expect(changePassword(userId, "not it 123", "brand new 2026", meta())).resolves.toEqual({
      ok: false,
      reason: "WRONG_PASSWORD",
    });
    await expect(changePassword(userId, PASSWORD, PASSWORD, meta())).resolves.toEqual({
      ok: false,
      reason: "SAME_PASSWORD",
    });
  });

  it("revokes every session and issues a fresh one", async () => {
    const { userId, email } = await member();
    const laptop = await signedIn(email);
    const phone = await signedIn(email);

    const result = await changePassword(userId, PASSWORD, "brand new 2026", meta());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(await revoked(laptop.token)).toBe(true);
    expect(await revoked(phone.token)).toBe(true);
    await expect(sessionFromToken(result.token)).resolves.toMatchObject({ userId });
    await expect(
      signIn({ identifier: email, password: "brand new 2026" }, meta()),
    ).resolves.toMatchObject({ ok: true });
  });
});

describe("revocation trigger", () => {
  it("ends sessions when the role changes", async () => {
    const { userId, email } = await member();
    const session = await signedIn(email);
    await db.query("UPDATE users SET role_id = ? WHERE user_id = ?", [
      await roleId(db, "FACULTY"),
      userId,
    ]);
    expect(await revoked(session.token)).toBe(true);
  });

  it("ends sessions when the account is suspended, not when it is touched", async () => {
    const { userId, email } = await member();
    const session = await signedIn(email);
    await db.query("UPDATE users SET full_name = 'Renamed Student' WHERE user_id = ?", [userId]);
    expect(await revoked(session.token)).toBe(false);
    await db.query("UPDATE users SET status = 'SUSPENDED' WHERE user_id = ?", [userId]);
    expect(await revoked(session.token)).toBe(true);
  });
});
