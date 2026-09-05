import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@/server/auth/password";
import { hashSessionToken } from "@/server/auth/tokens";
import { closePools } from "@/server/db/pool";
import { sessionFromToken, signIn, signOut } from "@/server/services/auth";
import { accountConnection } from "../support/accounts";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";
import { ER, expectSqlError } from "../support/sql-errors";

const PASSWORD = "shelf mark 42";
const meta = { ip: "203.0.113.7", userAgent: "vitest" };
let db: Connection;
let userId: number;
let email: string;
let universityId: string;

beforeAll(async () => {
  db = await adminConnection();
  userId = await insertUser(db, "STUDENT");
  await db.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [
    await hashPassword(PASSWORD),
    userId,
  ]);
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT email, university_id FROM users WHERE user_id = ?",
    [userId],
  );
  email = String(rows[0]?.email);
  universityId = String(rows[0]?.university_id);
});

afterAll(async () => {
  await closePools();
  await db.end();
});

const attempts = async (identifier: string) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT success FROM auth_attempts WHERE identifier = ? ORDER BY attempt_id",
    [identifier],
  );
  return rows.map((row) => Boolean(row.success));
};

describe("sign in", () => {
  it("accepts an email and stores only the token hash", async () => {
    const result = await signIn({ identifier: email, password: PASSWORD }, meta);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user).toEqual({ userId, role: "STUDENT" });

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT token_hash, ip, user_agent FROM auth_sessions WHERE user_id = ? ORDER BY session_id DESC LIMIT 1",
      [userId],
    );
    expect(rows[0]).toEqual({
      token_hash: hashSessionToken(result.token),
      ip: meta.ip,
      user_agent: "vitest",
    });
    expect(JSON.stringify(rows)).not.toContain(result.token);
  });

  it("accepts a university id", async () => {
    const result = await signIn({ identifier: universityId, password: PASSWORD }, meta);
    expect(result.ok).toBe(true);
  });

  it("gives the same answer for a wrong password and an unknown account", async () => {
    await expect(
      signIn({ identifier: email, password: "wrong password 1" }, meta),
    ).resolves.toEqual({
      ok: false,
      reason: "INVALID",
    });
    await expect(
      signIn({ identifier: "nobody@test.librasearch.local", password: PASSWORD }, meta),
    ).resolves.toEqual({ ok: false, reason: "INVALID" });
    expect(await attempts("nobody@test.librasearch.local")).toEqual([false]);
  });

  it("refuses a suspended account even with the right password", async () => {
    const suspended = await insertUser(db, "STUDENT");
    await db.query("UPDATE users SET password_hash = ?, status = 'SUSPENDED' WHERE user_id = ?", [
      await hashPassword(PASSWORD),
      suspended,
    ]);
    const [rows] = await db.query<RowDataPacket[]>("SELECT email FROM users WHERE user_id = ?", [
      suspended,
    ]);
    await expect(
      signIn({ identifier: String(rows[0]?.email), password: PASSWORD }, meta),
    ).resolves.toEqual({
      ok: false,
      reason: "INACTIVE",
    });
  });

  it("records the last login time", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT last_login_at FROM users WHERE user_id = ?",
      [userId],
    );
    expect(rows[0]?.last_login_at).toBeInstanceOf(Date);
  });
});

describe("session lookup", () => {
  it("resolves a live token to its user", async () => {
    const result = await signIn({ identifier: email, password: PASSWORD }, meta);
    if (!result.ok) throw new Error("sign in failed");
    const user = await sessionFromToken(result.token);
    expect(user).toMatchObject({ userId, role: "STUDENT", email });
  });

  it("ignores malformed and unknown tokens", async () => {
    await expect(sessionFromToken(undefined)).resolves.toBeNull();
    await expect(sessionFromToken("x")).resolves.toBeNull();
    await expect(sessionFromToken("a".repeat(43))).resolves.toBeNull();
  });

  it("stops working after sign out", async () => {
    const result = await signIn({ identifier: email, password: PASSWORD }, meta);
    if (!result.ok) throw new Error("sign in failed");
    await signOut(result.token);
    await expect(sessionFromToken(result.token)).resolves.toBeNull();
  });

  it("stops working once expired", async () => {
    const result = await signIn({ identifier: email, password: PASSWORD }, meta);
    if (!result.ok) throw new Error("sign in failed");
    await db.query(
      "UPDATE auth_sessions SET created_at = NOW(3) - INTERVAL 2 DAY, expires_at = NOW(3) - INTERVAL 1 DAY WHERE token_hash = ?",
      [hashSessionToken(result.token)],
    );
    await expect(sessionFromToken(result.token)).resolves.toBeNull();
  });

  it("stops working when the account is suspended", async () => {
    const result = await signIn({ identifier: email, password: PASSWORD }, meta);
    if (!result.ok) throw new Error("sign in failed");
    await db.query("UPDATE users SET status = 'SUSPENDED' WHERE user_id = ?", [userId]);
    try {
      await expect(sessionFromToken(result.token)).resolves.toBeNull();
    } finally {
      await db.query("UPDATE users SET status = 'ACTIVE' WHERE user_id = ?", [userId]);
    }
  });
});

describe("the auth database account", () => {
  let auth: Connection;

  beforeAll(async () => {
    auth = await accountConnection("auth");
  });

  afterAll(async () => {
    await auth.end();
  });

  it("cannot change a role", async () => {
    await expectSqlError(
      auth.query("UPDATE users SET role_id = 3 WHERE user_id = ?", [userId]),
      ER.COLUMNACCESS_DENIED,
    );
  });

  it("cannot read contact columns it does not need", async () => {
    await expectSqlError(auth.query("SELECT phone FROM users LIMIT 1"), ER.COLUMNACCESS_DENIED);
  });

  it("cannot write outside its tables", async () => {
    await expectSqlError(
      auth.query("INSERT INTO departments (dept_code, dept_name) VALUES ('HACK', 'Nope')"),
      ER.TABLEACCESS_DENIED,
    );
    await expectSqlError(auth.query("DELETE FROM auth_sessions"), ER.TABLEACCESS_DENIED);
  });
});
