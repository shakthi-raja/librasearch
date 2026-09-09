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

const loanRow = async (loanId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT loan_id, copy_id, member_id, issued_by, due_at, period_rule, returned_at FROM loans WHERE loan_id = ?",
    [loanId],
  );
  return rows[0] as {
    loan_id: number;
    copy_id: number;
    member_id: number;
    issued_by: number;
    due_at: Date;
    period_rule: string;
    returned_at: Date | null;
  };
};

const issue = async (barcode: string, memberId: number, actorId = librarian) => {
  await db.query("CALL sp_issue_copy(?, ?, ?, @issued_loan)", [barcode, memberId, actorId]);
  const [rows] = await db.query<RowDataPacket[]>("SELECT @issued_loan AS loan_id");
  return Number((rows[0] as { loan_id: number | null }).loan_id);
};

const directLoan = async (copyId: number, memberId: number) => {
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO loans (copy_id, member_id, issued_by, due_at) VALUES (?, ?, ?, NOW(3) + INTERVAL 14 DAY)",
    [copyId, memberId, librarian],
  );
  await db.query("UPDATE copies SET status = 'ON_LOAN' WHERE copy_id = ?", [copyId]);
  return result.insertId;
};

describe("sp_issue_copy", () => {
  it("issues a free copy and records the loan on the shelf account", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const copy = await copyRow(copyIds[0] as number);

    const loanId = await issue(copy.barcode, student);
    const loan = await loanRow(loanId);

    expect(loan).toMatchObject({
      copy_id: copy.copy_id,
      member_id: student,
      issued_by: librarian,
      period_rule: "STANDARD",
      returned_at: null,
    });
    expect(new Date(loan.due_at).getTime()).toBeGreaterThan(Date.now());
    expect((await copyRow(copy.copy_id)).status).toBe("ON_LOAN");
  });

  it("refuses an unknown barcode", async () => {
    const student = await insertUser(db, "STUDENT");
    await expectSqlError(issue("LS99999999", student), ER.SIGNAL_EXCEPTION, /LS002/);
  });

  it("refuses a reference-only copy", async () => {
    const student = await insertUser(db, "STUDENT");
    const { editionId } = await insertStockedBook(db, 1);
    const copyId = await insertCopy(db, editionId, { loanPolicy: "REFERENCE_ONLY" });
    const copy = await copyRow(copyId);

    await expectSqlError(issue(copy.barcode, student), ER.SIGNAL_EXCEPTION, /LS004/);
    expect((await copyRow(copyId)).status).toBe("AVAILABLE");
  });

  it("refuses a copy that is already on loan", async () => {
    const first = await insertUser(db, "STUDENT");
    const second = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await directLoan(copyId, first);
    const copy = await copyRow(copyId);

    await expectSqlError(issue(copy.barcode, second), ER.SIGNAL_EXCEPTION, /LS003/);
  });

  it("refuses a suspended member", async () => {
    const student = await insertUser(db, "STUDENT");
    await db.query("UPDATE users SET status = 'SUSPENDED' WHERE user_id = ?", [student]);
    const { copyIds } = await insertStockedBook(db, 1);
    const copy = await copyRow(copyIds[0] as number);

    await expectSqlError(issue(copy.barcode, student), ER.SIGNAL_EXCEPTION, /LS001/);
  });

  it("refuses a member who already holds the maximum number of loans", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 5);
    for (const copyId of copyIds.slice(0, 4)) await directLoan(copyId as number, student);
    const copy = await copyRow(copyIds[4] as number);

    await expectSqlError(issue(copy.barcode, student), ER.SIGNAL_EXCEPTION, /LS005/);
  });

  it("refuses a member whose unpaid fines pass the threshold", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 2);
    const closed = await directLoan(copyIds[0] as number, student);
    await db.query(
      "UPDATE loans SET returned_at = NOW(3), end_reason = 'RETURNED', return_condition = 'GOOD' WHERE loan_id = ?",
      [closed],
    );
    await db.query("INSERT INTO fines (loan_id, amount, days_overdue) VALUES (?, 150.00, 30)", [
      closed,
    ]);
    const copy = await copyRow(copyIds[1] as number);

    await expectSqlError(issue(copy.barcode, student), ER.SIGNAL_EXCEPTION, /LS006/);
  });

  it("refuses a copy held for someone else", async () => {
    const owner = await insertUser(db, "STUDENT");
    const other = await insertUser(db, "STUDENT");
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await db.query("UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = ?", [copyId]);
    await db.query(
      "INSERT INTO holds (book_id, member_id, status, ready_copy_id, ready_at, pickup_by) VALUES (?, ?, 'READY', ?, NOW(3), NOW(3) + INTERVAL 48 HOUR)",
      [bookId, owner, copyId],
    );
    const copy = await copyRow(copyId);

    await expectSqlError(issue(copy.barcode, other), ER.SIGNAL_EXCEPTION, /LS007/);
  });

  it("fulfils the member's ready hold when the reserved copy is issued", async () => {
    const student = await insertUser(db, "STUDENT");
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await db.query("UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = ?", [copyId]);
    const [hold] = await db.query<ResultSetHeader>(
      "INSERT INTO holds (book_id, member_id, status, ready_copy_id, ready_at, pickup_by) VALUES (?, ?, 'READY', ?, NOW(3), NOW(3) + INTERVAL 48 HOUR)",
      [bookId, student, copyId],
    );
    const copy = await copyRow(copyId);

    const loanId = await issue(copy.barcode, student);
    expect(await loanRow(loanId)).toMatchObject({ copy_id: copyId, member_id: student });

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT status, closed_at FROM holds WHERE hold_id = ?",
      [hold.insertId],
    );
    expect(rows[0]?.status).toBe("FULFILLED");
    expect(rows[0]?.closed_at).not.toBeNull();
  });

  it("refuses a withdrawn book", async () => {
    const student = await insertUser(db, "STUDENT");
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    await db.query("UPDATE books SET status = 'WITHDRAWN' WHERE book_id = ?", [bookId]);
    const copy = await copyRow(copyIds[0] as number);

    await expectSqlError(issue(copy.barcode, student), ER.SIGNAL_EXCEPTION, /LS008/);
  });

  it("refuses an actor who is not a librarian", async () => {
    const student = await insertUser(db, "STUDENT");
    const impostor = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const copy = await copyRow(copyIds[0] as number);

    await expectSqlError(issue(copy.barcode, student, impostor), ER.SIGNAL_EXCEPTION, /LS009/);
  });
});
