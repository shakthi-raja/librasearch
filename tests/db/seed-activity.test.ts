import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handStrandedCopies } from "../../db/seed/activity";
import { insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;
let bookId: number;
let regular: number[];
let reference: number;
let first: number;
let second: number;

beforeAll(async () => {
  db = await adminConnection();
  const stocked = await insertStockedBook(db, 3);
  bookId = stocked.bookId;
  regular = stocked.copyIds.slice(0, 2);
  reference = stocked.copyIds[2] as number;
  await db.query("UPDATE copies SET loan_policy = 'REFERENCE_ONLY' WHERE copy_id = ?", [reference]);
  first = await insertUser(db, "STUDENT");
  second = await insertUser(db, "STUDENT");
  // one waiting member for two copies left on the shelf
  await db.query<ResultSetHeader>(
    "INSERT INTO holds (book_id, member_id, placed_at, status) VALUES (?, ?, NOW(3) - INTERVAL 2 DAY, 'WAITING')",
    [bookId, first],
  );
});

afterAll(async () => {
  await db.end();
});

describe("seed: copies left on the shelf while someone waits", () => {
  it("hands one copy to the first hold, like a return at the desk", async () => {
    const made = await handStrandedCopies(db, [bookId]);
    expect(made).toBe(1);

    const [holds] = await db.query<RowDataPacket[]>(
      "SELECT member_id, status, ready_copy_id, pickup_by FROM holds WHERE book_id = ?",
      [bookId],
    );
    expect(holds).toHaveLength(1);
    expect(holds[0]).toMatchObject({
      member_id: first,
      status: "READY",
      ready_copy_id: regular[0],
    });
    expect(holds[0]?.pickup_by).not.toBeNull();

    const [copies] = await db.query<RowDataPacket[]>(
      "SELECT copy_id, status FROM copies WHERE copy_id IN (?) ORDER BY copy_id",
      [[...regular, reference]],
    );
    expect(copies.map((c) => c.status)).toEqual(["ON_HOLD_SHELF", "AVAILABLE", "AVAILABLE"]);
  });

  it("tells the member, and leaves reference copies and members not waiting alone", async () => {
    const [notices] = await db.query<RowDataPacket[]>(
      "SELECT user_id, type, link FROM notifications WHERE user_id IN (?, ?)",
      [first, second],
    );
    expect(notices).toEqual([
      expect.objectContaining({ user_id: first, type: "HOLD_READY", link: "/student" }),
    ]);
  });

  it("does nothing more once nobody is waiting", async () => {
    expect(await handStrandedCopies(db, [bookId])).toBe(0);
  });
});
