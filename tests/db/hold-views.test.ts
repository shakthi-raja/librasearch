import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { accountConnection } from "../support/accounts";
import { insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;
let bookId: number;
let copyId: number;
let readyHold: number;
let waitingHold: number;
let thirdHold: number;
let readyMember: number;
let waitingMember: number;

beforeAll(async () => {
  db = await adminConnection();
  const stock = await insertStockedBook(db, 1);
  bookId = stock.bookId;
  copyId = stock.copyIds[0] as number;
  readyMember = await insertUser(db, "STUDENT");
  waitingMember = await insertUser(db, "STUDENT");
  const third = await insertUser(db, "STUDENT");

  await db.query("UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = ?", [copyId]);
  const [ready] = await db.query<ResultSetHeader>(
    "INSERT INTO holds (book_id, member_id, status, ready_copy_id, ready_at, pickup_by) VALUES (?, ?, 'READY', ?, NOW(3), NOW(3) + INTERVAL 48 HOUR)",
    [bookId, readyMember, copyId],
  );
  readyHold = ready.insertId;
  const [waiting] = await db.query<ResultSetHeader>(
    "INSERT INTO holds (book_id, member_id) VALUES (?, ?)",
    [bookId, waitingMember],
  );
  waitingHold = waiting.insertId;
  const [last] = await db.query<ResultSetHeader>(
    "INSERT INTO holds (book_id, member_id) VALUES (?, ?)",
    [bookId, third],
  );
  thirdHold = last.insertId;
});

afterAll(async () => {
  await db.end();
});

describe("v_hold_queue", () => {
  it("numbers the active holds per book in placed order", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT hold_id, queue_position, status, member_name, title, ready_barcode, ready_rack FROM v_hold_queue WHERE book_id = ? ORDER BY queue_position",
      [bookId],
    );
    expect(rows.map((row) => row.hold_id)).toEqual([readyHold, waitingHold, thirdHold]);
    expect(rows.map((row) => row.queue_position)).toEqual([1, 2, 3]);
    expect(rows[0]?.status).toBe("READY");
    expect(rows[0]?.member_name).toBeTruthy();
    expect(String(rows[0]?.title)).toMatch(/^Test book/);
    expect(rows[0]?.ready_barcode).toBeTruthy();
    expect(rows[0]?.ready_rack).toBe("CS-04");
    expect(rows[1]?.status).toBe("WAITING");
  });

  it("is readable through the student account", async () => {
    const student = await accountConnection("student");
    try {
      const [rows] = await student.query<RowDataPacket[]>(
        "SELECT hold_id, queue_position FROM v_hold_queue WHERE member_id = ?",
        [waitingMember],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.hold_id).toBe(waitingHold);
      expect(rows[0]?.queue_position).toBe(2);
    } finally {
      await student.end();
    }
  });
});
