import type { Connection, ResultSetHeader } from "mysql2/promise";
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

const openLoan = (copyId: number, memberId: number) =>
  db.query<ResultSetHeader>(
    "INSERT INTO loans (copy_id, member_id, issued_by, due_at) VALUES (?, ?, ?, NOW(3) + INTERVAL 14 DAY)",
    [copyId, memberId, librarian],
  );

describe("loans", () => {
  it("allow one open loan per copy, enforced by the generated column", async () => {
    const { copyIds } = await insertStockedBook(db, 1);
    const copy = copyIds[0] as number;
    const [first] = await openLoan(copy, await insertUser(db, "STUDENT"));
    await expectSqlError(
      openLoan(copy, await insertUser(db, "STUDENT")),
      ER.DUP_ENTRY,
      /uq_loans_one_open_per_copy/,
    );

    await db.query(
      "UPDATE loans SET returned_at = NOW(3) + INTERVAL 1 SECOND, end_reason = 'RETURNED' WHERE loan_id = ?",
      [first.insertId],
    );
    await expect(openLoan(copy, await insertUser(db, "STUDENT"))).resolves.toBeDefined();
  });

  it("must be due after issue, close with a reason, and never be self-issued", async () => {
    const { copyIds } = await insertStockedBook(db, 3);
    const member = await insertUser(db, "STUDENT");
    await expectSqlError(
      db.query(
        "INSERT INTO loans (copy_id, member_id, issued_by, due_at) VALUES (?, ?, ?, NOW(3) - INTERVAL 1 DAY)",
        [copyIds[0], member, librarian],
      ),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_loans_due/,
    );
    const [loan] = await openLoan(copyIds[1] as number, member);
    await expectSqlError(
      db.query("UPDATE loans SET returned_at = NOW(3) + INTERVAL 1 SECOND WHERE loan_id = ?", [
        loan.insertId,
      ]),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_loans_closed/,
    );
    await expectSqlError(
      openLoan(copyIds[2] as number, librarian),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_loans_not_self_issued/,
    );
  });
});

describe("holds", () => {
  it("allow one active hold per member per book", async () => {
    const { bookId } = await insertStockedBook(db, 0);
    const member = await insertUser(db, "STUDENT");
    const place = () =>
      db.query("INSERT INTO holds (book_id, member_id) VALUES (?, ?)", [bookId, member]);
    await place();
    await expectSqlError(place(), ER.DUP_ENTRY, /uq_holds_one_active_per_member/);
    await db.query(
      "UPDATE holds SET status = 'CANCELLED', closed_at = NOW(3) WHERE book_id = ? AND member_id = ?",
      [bookId, member],
    );
    await expect(place()).resolves.toBeDefined();
  });

  it("need a copy and a pickup deadline to be ready, and one ready hold per copy", async () => {
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    const [a] = await db.query<ResultSetHeader>(
      "INSERT INTO holds (book_id, member_id) VALUES (?, ?)",
      [bookId, await insertUser(db, "STUDENT")],
    );
    await expectSqlError(
      db.query("UPDATE holds SET status = 'READY' WHERE hold_id = ?", [a.insertId]),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_holds_ready/,
    );
    const ready =
      "UPDATE holds SET status = 'READY', ready_copy_id = ?, ready_at = NOW(3), pickup_by = NOW(3) + INTERVAL 48 HOUR WHERE hold_id = ?";
    await db.query(ready, [copyIds[0], a.insertId]);
    const [b] = await db.query<ResultSetHeader>(
      "INSERT INTO holds (book_id, member_id) VALUES (?, ?)",
      [bookId, await insertUser(db, "STUDENT")],
    );
    await expectSqlError(
      db.query(ready, [copyIds[0], b.insertId]),
      ER.DUP_ENTRY,
      /uq_holds_one_ready_per_copy/,
    );
  });
});

describe("fines", () => {
  it("tie status to settlement and require a reason to waive", async () => {
    const { copyIds } = await insertStockedBook(db, 1);
    const [loan] = await openLoan(copyIds[0] as number, await insertUser(db, "STUDENT"));
    const [fine] = await db.query<ResultSetHeader>(
      "INSERT INTO fines (loan_id, amount, days_overdue) VALUES (?, 40.00, 8)",
      [loan.insertId],
    );
    await expectSqlError(
      db.query("UPDATE fines SET status = 'PAID' WHERE fine_id = ?", [fine.insertId]),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_fines_settled/,
    );
    await expectSqlError(
      db.query("UPDATE fines SET status = 'WAIVED', settled_at = NOW(3) WHERE fine_id = ?", [
        fine.insertId,
      ]),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_fines_waiver/,
    );
    await expectSqlError(
      db.query("INSERT INTO fines (loan_id, amount) VALUES (?, -1)", [loan.insertId]),
      ER.CHECK_CONSTRAINT_VIOLATED,
    );
  });
});

describe("audit log", () => {
  it("keeps entries for rows that no longer exist", async () => {
    await db.query(
      "INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data) VALUES ('users', '999999', 'DELETE', 999999, JSON_OBJECT('status', 'ACTIVE'))",
    );
  });
});
