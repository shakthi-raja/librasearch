import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { insertCopy, insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";
import { ER, expectSqlError } from "../support/sql-errors";

let db: Connection;
let librarian: number;

beforeAll(async () => {
  db = await adminConnection();
  librarian = await insertUser(db, "LIBRARIAN");
});

afterAll(async () => {
  await db.end();
});

const copyRow = async (copyId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT copy_id, barcode, status FROM copies WHERE copy_id = ?",
    [copyId],
  );
  return rows[0] as { copy_id: number; barcode: string; status: string };
};

const insertLoan = (copyId: number, memberId: number) =>
  db.query<ResultSetHeader>(
    "INSERT INTO loans (copy_id, member_id, issued_by, due_at) VALUES (?, ?, ?, NOW(3) + INTERVAL 14 DAY)",
    [copyId, memberId, librarian],
  );

const closeLoan = async (loanId: number) =>
  db.query(
    "UPDATE loans SET returned_at = NOW(3), end_reason = 'RETURNED', return_condition = 'GOOD' WHERE loan_id = ?",
    [loanId],
  );

describe("trg_loans_bi", () => {
  it("refuses a reference-only copy", async () => {
    const student = await insertUser(db, "STUDENT");
    const { editionId } = await insertStockedBook(db, 1);
    const copyId = await insertCopy(db, editionId, { loanPolicy: "REFERENCE_ONLY" });

    await expectSqlError(insertLoan(copyId, student), ER.SIGNAL_EXCEPTION, /LS004/);
  });

  it("refuses a copy that is already on loan", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await db.query("UPDATE copies SET status = 'ON_LOAN' WHERE copy_id = ?", [copyId]);

    await expectSqlError(insertLoan(copyId, student), ER.SIGNAL_EXCEPTION, /LS003/);
  });

  it("refuses a suspended member", async () => {
    const student = await insertUser(db, "STUDENT");
    await db.query("UPDATE users SET status = 'SUSPENDED' WHERE user_id = ?", [student]);
    const { copyIds } = await insertStockedBook(db, 1);

    await expectSqlError(insertLoan(copyIds[0] as number, student), ER.SIGNAL_EXCEPTION, /LS001/);
  });

  it("refuses a librarian account as the borrower", async () => {
    const { copyIds } = await insertStockedBook(db, 1);

    await expectSqlError(insertLoan(copyIds[0] as number, librarian), ER.SIGNAL_EXCEPTION, /LS001/);
  });

  it("refuses the loan that would pass the role limit", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 5);
    for (const copyId of copyIds.slice(0, 4)) await insertLoan(copyId as number, student);

    await expectSqlError(insertLoan(copyIds[4] as number, student), ER.SIGNAL_EXCEPTION, /LS005/);
  });

  it("refuses a member over the unpaid-fine threshold", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 2);
    const [closed] = await insertLoan(copyIds[0] as number, student);
    await closeLoan(closed.insertId);
    await db.query("INSERT INTO fines (loan_id, amount, days_overdue) VALUES (?, 150.00, 30)", [
      closed.insertId,
    ]);

    await expectSqlError(insertLoan(copyIds[1] as number, student), ER.SIGNAL_EXCEPTION, /LS006/);
  });

  it("refuses a hold-shelf copy without a ready hold", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await db.query("UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = ?", [copyId]);

    await expectSqlError(insertLoan(copyId, student), ER.SIGNAL_EXCEPTION, /LS007/);
  });

  it("allows the member the copy is reserved for", async () => {
    const student = await insertUser(db, "STUDENT");
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await db.query("UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = ?", [copyId]);
    await db.query(
      "INSERT INTO holds (book_id, member_id, status, ready_copy_id, ready_at, pickup_by) VALUES (?, ?, 'READY', ?, NOW(3), NOW(3) + INTERVAL 48 HOUR)",
      [bookId, student, copyId],
    );

    await expect(insertLoan(copyId, student)).resolves.toBeDefined();
  });

  it("refuses a withdrawn book", async () => {
    const student = await insertUser(db, "STUDENT");
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    await db.query("UPDATE books SET status = 'WITHDRAWN' WHERE book_id = ?", [bookId]);

    await expectSqlError(insertLoan(copyIds[0] as number, student), ER.SIGNAL_EXCEPTION, /LS008/);
  });
});

describe("trg_loans_au", () => {
  it("puts a returned copy back on the shelf when nobody waits", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    const [loan] = await insertLoan(copyId, student);
    await db.query("UPDATE copies SET status = 'ON_LOAN' WHERE copy_id = ?", [copyId]);

    await closeLoan(loan.insertId);

    expect((await copyRow(copyId)).status).toBe("AVAILABLE");
  });

  it("hands a returned copy to the oldest waiting hold", async () => {
    const borrower = await insertUser(db, "STUDENT");
    const holder = await insertUser(db, "STUDENT");
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    const [loan] = await insertLoan(copyId, borrower);
    await db.query("UPDATE copies SET status = 'ON_LOAN' WHERE copy_id = ?", [copyId]);
    const [hold] = await db.query<ResultSetHeader>(
      "INSERT INTO holds (book_id, member_id) VALUES (?, ?)",
      [bookId, holder],
    );

    await closeLoan(loan.insertId);

    expect((await copyRow(copyId)).status).toBe("ON_HOLD_SHELF");
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT status, ready_copy_id, pickup_by FROM holds WHERE hold_id = ?",
      [hold.insertId],
    );
    expect(rows[0]?.status).toBe("READY");
    expect(rows[0]?.ready_copy_id).toBe(copyId);
    expect(rows[0]?.pickup_by).not.toBeNull();
  });
});
