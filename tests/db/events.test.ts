import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

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
  const [rows] = await db.query<RowDataPacket[]>("SELECT status FROM copies WHERE copy_id = ?", [
    copyId,
  ]);
  return rows[0] as { status: string };
};

const loan = async (copyId: number, memberId: number, dueDays: number) => {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO loans (copy_id, member_id, issued_by, issued_at, due_at)
     VALUES (?, ?, ?, DATE_SUB(NOW(3), INTERVAL 14 DAY), DATE_ADD(NOW(3), INTERVAL ${dueDays} DAY))`,
    [copyId, memberId, librarian],
  );
  return result.insertId;
};

const fineFor = async (loanId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT fine_id, amount, days_overdue, status FROM fines WHERE loan_id = ?",
    [loanId],
  );
  return rows[0] as
    | { fine_id: number; amount: string; days_overdue: number; status: string }
    | undefined;
};

const notificationsFor = async (userId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT type, title, link FROM notifications WHERE user_id = ? ORDER BY type",
    [userId],
  );
  return rows as { type: string; title: string; link: string | null }[];
};

describe("sp_expire_holds", () => {
  it("expires an uncollected ready hold and gives the copy to the next waiter", async () => {
    const first = await insertUser(db, "STUDENT");
    const second = await insertUser(db, "STUDENT");
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await db.query("UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = ?", [copyId]);
    const [expired] = await db.query<ResultSetHeader>(
      "INSERT INTO holds (book_id, member_id, status, ready_copy_id, ready_at, pickup_by) VALUES (?, ?, 'READY', ?, DATE_SUB(NOW(3), INTERVAL 3 HOUR), DATE_SUB(NOW(3), INTERVAL 1 HOUR))",
      [bookId, first, copyId],
    );
    const [next] = await db.query<ResultSetHeader>(
      "INSERT INTO holds (book_id, member_id) VALUES (?, ?)",
      [bookId, second],
    );

    await db.query("CALL sp_expire_holds()");

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT hold_id, status, closed_at FROM holds WHERE hold_id IN (?, ?) ORDER BY hold_id",
      [expired.insertId, next.insertId],
    );
    expect(rows[0]?.status).toBe("EXPIRED");
    expect(rows[0]?.closed_at).not.toBeNull();
    expect(rows[1]?.status).toBe("READY");
    expect((await copyRow(copyId)).status).toBe("ON_HOLD_SHELF");
  });

  it("puts the copy back on the shelf when nobody is waiting", async () => {
    const member = await insertUser(db, "STUDENT");
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    await db.query("UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = ?", [copyId]);
    await db.query(
      "INSERT INTO holds (book_id, member_id, status, ready_copy_id, ready_at, pickup_by) VALUES (?, ?, 'READY', ?, DATE_SUB(NOW(3), INTERVAL 3 HOUR), DATE_SUB(NOW(3), INTERVAL 1 HOUR))",
      [bookId, member, copyId],
    );

    await db.query("CALL sp_expire_holds()");

    expect((await copyRow(copyId)).status).toBe("AVAILABLE");
  });
});

describe("sp_accrue_fines", () => {
  it("creates one unpaid fine for an overdue loan", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const loanId = await loan(copyIds[0] as number, student, -10);

    await db.query("CALL sp_accrue_fines()");

    const fine = await fineFor(loanId);
    expect(fine).toBeDefined();
    expect(Number(fine?.amount)).toBe(50);
    expect(fine?.days_overdue).toBe(10);
    expect(fine?.status).toBe("UNPAID");
  });

  it("updates the same fine on the next run instead of adding a row", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const loanId = await loan(copyIds[0] as number, student, -5);
    await db.query("INSERT INTO fines (loan_id, amount, days_overdue) VALUES (?, 10.00, 2)", [
      loanId,
    ]);

    await db.query("CALL sp_accrue_fines()");
    await db.query("CALL sp_accrue_fines()");

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT fine_id, amount, days_overdue FROM fines WHERE loan_id = ?",
      [loanId],
    );
    expect(rows).toHaveLength(1);
    expect(Number(rows[0]?.amount)).toBe(25);
    expect(rows[0]?.days_overdue).toBe(5);
  });

  it("leaves a loan that is not due yet alone", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 1);
    const loanId = await loan(copyIds[0] as number, student, 3);

    await db.query("CALL sp_accrue_fines()");

    await expect(fineFor(loanId)).resolves.toBeUndefined();
  });
});

describe("sp_send_due_notices", () => {
  it("tells the member about a due-soon and an overdue loan once", async () => {
    const student = await insertUser(db, "STUDENT");
    const { copyIds } = await insertStockedBook(db, 2);
    const soon = await loan(copyIds[0] as number, student, 1);
    const late = await loan(copyIds[1] as number, student, -2);

    await db.query("CALL sp_send_due_notices()");
    await db.query("CALL sp_send_due_notices()");

    const rows = await notificationsFor(student);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.type)).toEqual(["DUE_SOON", "OVERDUE"]);
    expect(rows[0]?.link).toBe(`/student/loans/${soon}`);
    expect(rows[1]?.link).toBe(`/student/loans/${late}`);
  });
});

describe("scheduled events", () => {
  it("registers the hold, fine and notice jobs", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT event_name AS name FROM information_schema.events WHERE event_schema = DATABASE() AND event_name IN ('ev_expire_holds', 'ev_accrue_fines', 'ev_due_notifications') ORDER BY event_name",
    );
    expect(rows.map((row) => row.name)).toEqual([
      "ev_accrue_fines",
      "ev_due_notifications",
      "ev_expire_holds",
    ]);
  });
});
