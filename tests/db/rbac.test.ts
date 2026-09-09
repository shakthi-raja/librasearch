import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { accountConnection } from "../support/accounts";
import { ER, expectSqlError } from "../support/sql-errors";

type Account = "auth" | "student" | "faculty" | "librarian";
const conns = {} as Record<Account, Connection>;

beforeAll(async () => {
  for (const account of ["auth", "student", "faculty", "librarian"] as const) {
    conns[account] = await accountConnection(account);
  }
});

afterAll(async () => {
  await Promise.all(Object.values(conns).map((c) => c.end()));
});

const count = async (account: Account, sql: string) => {
  const [rows] = await conns[account].query<RowDataPacket[]>(sql);
  return rows.length;
};

describe("app_student", () => {
  it("reads the public catalogue and availability", async () => {
    await expect(
      count("student", "SELECT * FROM v_catalog_public LIMIT 1"),
    ).resolves.toBeGreaterThanOrEqual(0);
    await expect(
      count("student", "SELECT * FROM v_book_availability LIMIT 1"),
    ).resolves.toBeGreaterThanOrEqual(0);
    await expect(count("student", "SELECT fn_available_copies(1) AS n")).resolves.toBe(1);
  });

  it("cannot change a loan: the 1142 demonstration", async () => {
    await expectSqlError(
      conns.student.query("UPDATE loans SET due_at = NOW()"),
      ER.TABLEACCESS_DENIED,
      /UPDATE command denied .* table 'loans'/,
    );
  });

  it("cannot read loans, fines, users or sessions directly", async () => {
    for (const table of ["loans", "fines", "users", "auth_sessions", "audit_log"]) {
      await expectSqlError(
        conns.student.query(`SELECT 1 FROM ${table} LIMIT 1`),
        ER.TABLEACCESS_DENIED,
      );
    }
  });

  it("sees copies without what the library paid for them", async () => {
    await expect(
      count("student", "SELECT copy_id, rack_code, status FROM copies LIMIT 1"),
    ).resolves.toBeGreaterThanOrEqual(0);
    await expectSqlError(
      conns.student.query("SELECT acquisition_cost FROM copies LIMIT 1"),
      ER.COLUMNACCESS_DENIED,
    );
  });

  it("cannot write the catalogue or the syllabus", async () => {
    await expectSqlError(
      conns.student.query("INSERT INTO categories (name, slug) VALUES ('x', 'student-write')"),
      ER.TABLEACCESS_DENIED,
    );
    await expectSqlError(
      conns.student.query("UPDATE syllabus_units SET hours = 1"),
      ER.TABLEACCESS_DENIED,
    );
  });
});

describe("app_faculty", () => {
  it("inherits the student role", async () => {
    await expect(
      count("faculty", "SELECT * FROM v_catalog_public LIMIT 1"),
    ).resolves.toBeGreaterThanOrEqual(0);
  });

  it("may review mappings but not change their similarity", async () => {
    await expect(
      conns.faculty.query("UPDATE unit_chapter_map SET status = 'APPROVED' WHERE 1 = 0"),
    ).resolves.toBeDefined();
    await expectSqlError(
      conns.faculty.query("UPDATE unit_chapter_map SET similarity = 1 WHERE 1 = 0"),
      ER.COLUMNACCESS_DENIED,
    );
  });

  it("cannot run the desk or delete syllabus units", async () => {
    await expectSqlError(
      conns.faculty.query("UPDATE loans SET due_at = NOW()"),
      ER.TABLEACCESS_DENIED,
    );
    await expectSqlError(
      conns.faculty.query("DELETE FROM syllabus_units WHERE 1 = 0"),
      ER.TABLEACCESS_DENIED,
    );
    await expectSqlError(
      conns.faculty.query("UPDATE copies SET status = 'LOST' WHERE 1 = 0"),
      ER.TABLEACCESS_DENIED,
    );
  });
});

describe("app_librarian", () => {
  it("runs operations across the schema", async () => {
    await expect(
      conns.librarian.query("UPDATE loans SET notes = notes WHERE 1 = 0"),
    ).resolves.toBeDefined();
    await expect(
      conns.librarian.query("UPDATE copies SET status = status WHERE 1 = 0"),
    ).resolves.toBeDefined();
    await expect(
      count("librarian", "SELECT * FROM audit_log LIMIT 1"),
    ).resolves.toBeGreaterThanOrEqual(0);
  });

  it("cannot change the schema", async () => {
    await expectSqlError(conns.librarian.query("DROP TABLE loans"), ER.TABLEACCESS_DENIED);
    await expectSqlError(
      conns.librarian.query("CREATE TABLE intruder (id INT)"),
      ER.TABLEACCESS_DENIED,
    );
  });
});

describe("app_auth", () => {
  it("cannot see the catalogue at all", async () => {
    await expectSqlError(conns.auth.query("SELECT 1 FROM books LIMIT 1"), ER.TABLEACCESS_DENIED);
  });
});
