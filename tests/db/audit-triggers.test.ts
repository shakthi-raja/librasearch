import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser, roleId } from "../support/fixtures";

let db: Connection;
let librarian: number;

beforeAll(async () => {
  db = await adminConnection();
  librarian = await insertUser(db, "LIBRARIAN");
});

afterAll(async () => {
  await db.end();
});

type AuditRow = {
  audit_id: number;
  table_name: string;
  record_id: string;
  action: string;
  changed_by: number | null;
  old_data: unknown;
  new_data: unknown;
};

const auditFor = async (table: string, record: number | string) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT audit_id, table_name, record_id, action, changed_by, old_data, new_data FROM audit_log WHERE table_name = ? AND record_id = ? ORDER BY audit_id",
    [table, String(record)],
  );
  return rows as AuditRow[];
};

const json = (value: unknown) => (typeof value === "string" ? JSON.parse(value) : value);

const asActor = (id: number) => db.query("SET @app_user_id = ?", [id]);

describe("user audit", () => {
  it("records a status change with the old and new values", async () => {
    const person = await insertUser(db, "STUDENT");
    await asActor(librarian);

    await db.query("UPDATE users SET status = 'SUSPENDED' WHERE user_id = ?", [person]);

    const rows = await auditFor("users", person);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ action: "UPDATE", changed_by: librarian });
    expect(json(rows[0]?.old_data)).toMatchObject({ status: "ACTIVE" });
    expect(json(rows[0]?.new_data)).toMatchObject({ status: "SUSPENDED" });
  });

  it("records a role change", async () => {
    const person = await insertUser(db, "STUDENT");
    await asActor(librarian);

    await db.query("UPDATE users SET role_id = ? WHERE user_id = ?", [
      await roleId(db, "FACULTY"),
      person,
    ]);

    const rows = await auditFor("users", person);
    expect(rows).toHaveLength(1);
    expect(json(rows[0]?.old_data)).toHaveProperty("role_id");
    expect(json(rows[0]?.new_data)).toHaveProperty("role_id");
  });

  it("ignores a name correction", async () => {
    const person = await insertUser(db, "STUDENT");
    await asActor(librarian);

    await db.query("UPDATE users SET full_name = 'Corrected Name' WHERE user_id = ?", [person]);

    await expect(auditFor("users", person)).resolves.toHaveLength(0);
  });
});

describe("copy audit", () => {
  it("records a status change", async () => {
    const { copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await asActor(librarian);

    await db.query("UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = ?", [copyId]);

    const rows = await auditFor("copies", copyId);
    expect(rows).toHaveLength(1);
    expect(json(rows[0]?.old_data)).toMatchObject({ status: "AVAILABLE" });
    expect(json(rows[0]?.new_data)).toMatchObject({ status: "ON_HOLD_SHELF" });
  });

  it("records a lending-policy change", async () => {
    const { copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await asActor(librarian);

    await db.query("UPDATE copies SET loan_policy = 'SHORT_LOAN' WHERE copy_id = ?", [copyId]);

    await expect(auditFor("copies", copyId)).resolves.toHaveLength(1);
  });

  it("ignores a shelf move", async () => {
    const { copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await asActor(librarian);

    await db.query("UPDATE copies SET shelf_code = 'S2' WHERE copy_id = ?", [copyId]);

    await expect(auditFor("copies", copyId)).resolves.toHaveLength(0);
  });
});

describe("fine audit", () => {
  it("records a settlement with the amount and the actor", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const [loan] = await db.query<ResultSetHeader>(
      "INSERT INTO loans (copy_id, member_id, issued_by, due_at) VALUES (?, ?, ?, NOW(3) + INTERVAL 14 DAY)",
      [copyIds[0], student, librarian],
    );
    const [fine] = await db.query<ResultSetHeader>(
      "INSERT INTO fines (loan_id, amount, days_overdue) VALUES (?, 40.00, 8)",
      [loan.insertId],
    );
    await asActor(librarian);

    await db.query(
      "UPDATE fines SET status = 'PAID', settled_at = NOW(3), settled_by = ? WHERE fine_id = ?",
      [librarian, fine.insertId],
    );

    const rows = await auditFor("fines", fine.insertId);
    expect(rows).toHaveLength(1);
    expect(json(rows[0]?.old_data)).toMatchObject({ status: "UNPAID", amount: 40 });
    expect(json(rows[0]?.new_data)).toMatchObject({ status: "PAID" });
    expect(rows[0]?.changed_by).toBe(librarian);
  });
});
