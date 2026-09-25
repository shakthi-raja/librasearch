import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";
import { ER, expectSqlError } from "../support/sql-errors";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

let seq = 0;
const subject = () => `google-${Date.now()}-${++seq}`;

const link = (userId: number, sub: string, email = "linked@test.librasearch.local") =>
  db.query(
    "INSERT INTO oauth_accounts (user_id, provider, subject, email) VALUES (?, 'GOOGLE', ?, ?)",
    [userId, sub, email],
  );

describe("oauth_accounts", () => {
  it("gives a google account to one member only", async () => {
    const sub = subject();
    await link(await insertUser(db, "STUDENT"), sub);
    await expectSqlError(link(await insertUser(db, "STUDENT"), sub), ER.DUP_ENTRY);
  });

  it("links one google account per member", async () => {
    const member = await insertUser(db, "STUDENT");
    await link(member, subject());
    await expectSqlError(link(member, subject()), ER.DUP_ENTRY);
  });

  it("rejects an address that is not lowercase and well formed", async () => {
    const member = await insertUser(db, "STUDENT");
    await expectSqlError(link(member, subject(), "Mixed@Case.com"), ER.CHECK_CONSTRAINT_VIOLATED);
  });

  it("audits linking and unlinking", async () => {
    const member = await insertUser(db, "FACULTY");
    const [result] = await link(member, subject());
    const id = (result as { insertId: number }).insertId;
    await db.query("DELETE FROM oauth_accounts WHERE oauth_account_id = ?", [id]);

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT action, changed_by FROM audit_log
        WHERE table_name = 'oauth_accounts' AND record_id = ? ORDER BY audit_id`,
      [String(id)],
    );
    expect(rows).toEqual([
      { action: "INSERT", changed_by: member },
      { action: "DELETE", changed_by: member },
    ]);
  });

  it("goes when the member goes", async () => {
    const member = await insertUser(db, "STUDENT");
    await link(member, subject());
    await db.query("DELETE FROM users WHERE user_id = ?", [member]);
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM oauth_accounts WHERE user_id = ?",
      [member],
    );
    expect(Number(rows[0]?.n)).toBe(0);
  });
});
