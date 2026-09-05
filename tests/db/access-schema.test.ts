import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminConnection } from "../support/db";
import { FAKE_ARGON2ID, insertDepartment, insertUser, roleId } from "../support/fixtures";
import { ER, expectSqlError } from "../support/sql-errors";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

const insertRawUser = (values: Record<string, unknown>) =>
  db.query("INSERT INTO users SET ?", [
    {
      university_id: "PES1UG24CS999",
      full_name: "Raw User",
      email: "raw.user@test.librasearch.local",
      password_hash: FAKE_ARGON2ID,
      ...values,
    },
  ]);

describe("roles", () => {
  it("seeds the three roles with their borrowing policy", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT role_name, max_loans, max_renewals, loan_days FROM roles ORDER BY role_id",
    );
    expect(rows).toEqual([
      { role_name: "STUDENT", max_loans: 4, max_renewals: 2, loan_days: 14 },
      { role_name: "FACULTY", max_loans: 10, max_renewals: 3, loan_days: 14 },
      { role_name: "LIBRARIAN", max_loans: 0, max_renewals: 0, loan_days: 14 },
    ]);
  });

  it("rejects an unknown role and an out-of-range policy", async () => {
    await expectSqlError(
      db.query(
        "INSERT INTO roles (role_name, description, max_loans, max_renewals, loan_days) VALUES ('ADMIN', 'x', 1, 1, 1)",
      ),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_roles_name/,
    );
    await expectSqlError(
      db.query("UPDATE roles SET max_loans = 50 WHERE role_name = 'STUDENT'"),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_roles_max_loans/,
    );
  });

  it("cannot be deleted while a user holds it", async () => {
    await insertUser(db, "FACULTY");
    await expectSqlError(
      db.query("DELETE FROM roles WHERE role_name = 'FACULTY'"),
      ER.ROW_IS_REFERENCED,
    );
  });
});

describe("users", () => {
  it("enforces unique university id and email", async () => {
    await insertUser(db, "STUDENT", {
      universityId: "PES1UG24CS001",
      email: "a.student@test.librasearch.local",
    });
    await expectSqlError(
      insertUser(db, "STUDENT", { universityId: "PES1UG24CS001" }),
      ER.DUP_ENTRY,
      /uq_users_university_id/,
    );
    await expectSqlError(
      insertUser(db, "STUDENT", { email: "a.student@test.librasearch.local" }),
      ER.DUP_ENTRY,
      /uq_users_email/,
    );
  });

  it.each([
    ["an uppercase email", { email: "Mixed.Case@test.librasearch.local" }, /ck_users_email/],
    ["an email without a domain", { email: "nobody@localhost" }, /ck_users_email/],
    ["a plain-text password", { password_hash: "Libra@2026" }, /ck_users_password_hash/],
    ["a bcrypt hash", { password_hash: "$2b$12$abcdefghijklmnopqrstuv" }, /ck_users_password_hash/],
    ["a malformed university id", { university_id: "pes 1" }, /ck_users_university_id/],
    ["a malformed phone", { phone: "98-45" }, /ck_users_phone/],
    ["an impossible batch year", { batch_year: 1890 }, /ck_users_batch_year/],
  ])("rejects %s", async (_label, values, constraint) => {
    await expectSqlError(
      insertRawUser({ role_id: await roleId(db, "STUDENT"), ...values }),
      ER.CHECK_CONSTRAINT_VIOLATED,
      constraint,
    );
  });

  it("rejects an unknown role", async () => {
    await expectSqlError(insertRawUser({ role_id: 999 }), ER.NO_REFERENCED_ROW);
  });

  it("keeps the user when their department is removed", async () => {
    const deptId = await insertDepartment(db);
    const userId = await insertUser(db, "FACULTY", { deptId });
    await db.query("DELETE FROM departments WHERE dept_id = ?", [deptId]);
    const [rows] = await db.query<RowDataPacket[]>("SELECT dept_id FROM users WHERE user_id = ?", [
      userId,
    ]);
    expect(rows[0]?.dept_id).toBeNull();
  });
});

describe("auth_sessions", () => {
  it("stores only a 64-character hex token hash", async () => {
    const userId = await insertUser(db, "STUDENT");
    await expectSqlError(
      db.query(
        "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, 'not-a-hash', NOW(3) + INTERVAL 1 DAY)",
        [userId],
      ),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_auth_sessions_token/,
    );
  });

  it("must expire after it is created", async () => {
    const userId = await insertUser(db, "STUDENT");
    await expectSqlError(
      db.query(
        "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, REPEAT('a', 64), NOW(3) - INTERVAL 1 SECOND)",
        [userId],
      ),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_auth_sessions_expiry/,
    );
  });

  it("is removed with its user", async () => {
    const userId = await insertUser(db, "STUDENT");
    await db.query(
      "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, REPEAT('b', 64), NOW(3) + INTERVAL 1 DAY)",
      [userId],
    );
    await db.query("DELETE FROM users WHERE user_id = ?", [userId]);
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM auth_sessions WHERE user_id = ?",
      [userId],
    );
    expect(rows[0]?.n).toBe(0);
  });
});
