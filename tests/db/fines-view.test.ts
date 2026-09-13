import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;
let librarian: number;
let member: number;
let fineId: number;

beforeAll(async () => {
  db = await adminConnection();
  librarian = await insertUser(db, "LIBRARIAN");
  member = await insertUser(db, "STUDENT");
  const { copyIds } = await insertStockedBook(db, 1);
  const [loan] = await db.query<ResultSetHeader>(
    "INSERT INTO loans (copy_id, member_id, issued_by, issued_at, due_at) VALUES (?, ?, ?, NOW(3) - INTERVAL 20 DAY, NOW(3) - INTERVAL 3 DAY)",
    [copyIds[0], member, librarian],
  );
  const [fine] = await db.query<ResultSetHeader>(
    "INSERT INTO fines (loan_id, amount, days_overdue) VALUES (?, 40.00, 8)",
    [loan.insertId],
  );
  fineId = fine.insertId;
});

afterAll(async () => {
  await db.end();
});

describe("v_fines", () => {
  it("joins a fine to its member, loan, book and copy", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT fine_id, loan_id, member_name, university_id, title, barcode, amount, days_overdue, status FROM v_fines WHERE fine_id = ?",
      [fineId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      fine_id: fineId,
      member_name: expect.any(String),
      university_id: expect.any(String),
      status: "UNPAID",
    });
    expect(Number(rows[0]?.amount)).toBe(40);
    expect(rows[0]?.days_overdue).toBe(8);
    expect(String(rows[0]?.title)).toMatch(/^Test book/);
  });
});
