import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { insertStockedBook } from "../support/catalogue";
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

const issue = async (barcode: string, memberId: number) => {
  await db.query("CALL sp_issue_copy(?, ?, ?, @issued_loan)", [barcode, memberId, librarian]);
  const [rows] = await db.query<RowDataPacket[]>("SELECT @issued_loan AS loan_id");
  return Number((rows[0] as { loan_id: number | null }).loan_id);
};

const returnCopy = async (barcode: string) => {
  await db.query("CALL sp_return_copy(?, ?, @returned_loan, @returned_fine)", [barcode, librarian]);
  const [rows] = await db.query<RowDataPacket[]>("SELECT @returned_loan AS loan_id");
  return Number((rows[0] as { loan_id: number | null }).loan_id);
};

const placeHold = async (bookId: number, memberId: number) => {
  await db.query("CALL sp_place_hold(?, ?, @new_hold)", [bookId, memberId]);
  const [rows] = await db.query<RowDataPacket[]>("SELECT @new_hold AS hold_id");
  return Number((rows[0] as { hold_id: number | null }).hold_id);
};

const cancelHold = (holdId: number, actorId: number) =>
  db.query("CALL sp_cancel_hold(?, ?)", [holdId, actorId]);

const directLoan = async (copyId: number, memberId: number) => {
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO loans (copy_id, member_id, issued_by, due_at) VALUES (?, ?, ?, NOW(3) + INTERVAL 14 DAY)",
    [copyId, memberId, librarian],
  );
  await db.query("UPDATE copies SET status = 'ON_LOAN' WHERE copy_id = ?", [copyId]);
  return result.insertId;
};

describe("issue edge cases", () => {
  it("refuses a hold-shelf copy with no ready hold", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await db.query("UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = ?", [copyId]);
    const copy = await copyRow(copyId);

    await expectSqlError(issue(copy.barcode, student), ER.SIGNAL_EXCEPTION, /LS007/);
  });

  it("refuses a free copy when the member's ready copy is a different one", async () => {
    const student = await insertUser(db, "STUDENT");
    const { bookId, copyIds } = await insertStockedBook(db, 2);
    const reserved = copyIds[0] as number;
    const free = await copyRow(copyIds[1] as number);
    await db.query("UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = ?", [reserved]);
    await db.query(
      "INSERT INTO holds (book_id, member_id, status, ready_copy_id, ready_at, pickup_by) VALUES (?, ?, 'READY', ?, NOW(3), NOW(3) + INTERVAL 48 HOUR)",
      [bookId, student, reserved],
    );

    await expectSqlError(issue(free.barcode, student), ER.SIGNAL_EXCEPTION, /LS007/);
  });
});

describe("return edge cases", () => {
  it("refuses an unknown barcode", async () => {
    await expectSqlError(returnCopy("LS99999999"), ER.SIGNAL_EXCEPTION, /LS010/);
  });
});

describe("renewal edge cases", () => {
  it("refuses a returned loan", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const copy = await copyRow(copyIds[0] as number);
    const loanId = await issue(copy.barcode, student);
    await returnCopy(copy.barcode);

    await expectSqlError(
      db.query("CALL sp_renew_loan(?, ?, @due)", [loanId, student]),
      ER.SIGNAL_EXCEPTION,
      /LS010/,
    );
  });

  it("refuses a loan id that does not exist", async () => {
    const student = await insertUser(db, "STUDENT");
    await expectSqlError(
      db.query("CALL sp_renew_loan(99999999, ?, @due)", [student]),
      ER.SIGNAL_EXCEPTION,
      /LS010/,
    );
  });
});

describe("hold edge cases", () => {
  it("refuses a hold on a withdrawn book", async () => {
    const student = await insertUser(db, "STUDENT");
    const { bookId } = await insertStockedBook(db, 1);
    await db.query("UPDATE books SET status = 'WITHDRAWN' WHERE book_id = ?", [bookId]);

    await expectSqlError(placeHold(bookId, student), ER.SIGNAL_EXCEPTION, /LS008/);
  });

  it("lets a librarian cancel a member's waiting hold", async () => {
    const student = await insertUser(db, "STUDENT");
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    await directLoan(copyIds[0] as number, await insertUser(db, "STUDENT"));
    const holdId = await placeHold(bookId, student);

    await cancelHold(holdId, librarian);

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT status, closed_at FROM holds WHERE hold_id = ?",
      [holdId],
    );
    expect(rows[0]?.status).toBe("CANCELLED");
    expect(rows[0]?.closed_at).not.toBeNull();
  });

  it("refuses a hold id that does not exist", async () => {
    const student = await insertUser(db, "STUDENT");
    await expectSqlError(cancelHold(99999999, student), ER.SIGNAL_EXCEPTION, /LS017/);
  });
});
