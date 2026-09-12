import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { accountConnection } from "../support/accounts";
import { insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;
let librarian: number;
let member: number;
let loanId: number;

beforeAll(async () => {
  db = await adminConnection();
  librarian = await insertUser(db, "LIBRARIAN");
  member = await insertUser(db, "STUDENT");
  const { copyIds } = await insertStockedBook(db, 1);
  const [loan] = await db.query<ResultSetHeader>(
    "INSERT INTO loans (copy_id, member_id, issued_by, due_at) VALUES (?, ?, ?, NOW(3) + INTERVAL 14 DAY)",
    [copyIds[0], member, librarian],
  );
  loanId = loan.insertId;
});

afterAll(async () => {
  await db.end();
});

describe("v_member_loans", () => {
  it("joins the loan to its book, copy and current fine", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT loan_id, member_id, title, barcode, renew_count, days_overdue, fine_due FROM v_member_loans WHERE loan_id = ?",
      [loanId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      loan_id: loanId,
      member_id: member,
      renew_count: 0,
      days_overdue: 0,
      fine_due: "0.00",
    });
    expect(String(rows[0]?.title)).toMatch(/^Test book/);
  });

  it("shows an unpaid fine on the loan", async () => {
    await db.query("INSERT INTO fines (loan_id, amount, days_overdue) VALUES (?, 40.00, 8)", [
      loanId,
    ]);

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT fine_due FROM v_member_loans WHERE loan_id = ?",
      [loanId],
    );
    expect(Number(rows[0]?.fine_due)).toBe(40);
  });
});

describe("v_member_overview", () => {
  it("carries the role limits, active loans and unpaid total", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT max_loans, max_renewals, active_loans, unpaid_fines FROM v_member_overview WHERE user_id = ?",
      [member],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      max_loans: 4,
      max_renewals: 2,
      active_loans: 1,
    });
    expect(Number(rows[0]?.unpaid_fines)).toBe(40);
  });
});

describe("the student database account", () => {
  it("can read the member views and sees only the row it asks for", async () => {
    const student = await accountConnection("student");
    try {
      const [rows] = await student.query<RowDataPacket[]>(
        "SELECT loan_id FROM v_member_loans WHERE member_id = ?",
        [member],
      );
      expect(rows.map((row) => row.loan_id)).toContain(loanId);

      const [overview] = await student.query<RowDataPacket[]>(
        "SELECT active_loans FROM v_member_overview WHERE user_id = ?",
        [member],
      );
      expect(Number(overview[0]?.active_loans)).toBe(1);
    } finally {
      await student.end();
    }
  });
});
