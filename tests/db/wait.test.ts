import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { issueCopy } from "@/server/services/circulation";
import { placeHold } from "@/server/services/holds";
import { waitForBook } from "@/server/services/wait";
import { insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

const id = async (userId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT university_id FROM users WHERE user_id = ?",
    [userId],
  );
  return String(rows[0]?.university_id);
};

describe("waitForBook", () => {
  it("says when the only copy is due and who is ahead", async () => {
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    const [rows] = await db.query<RowDataPacket[]>("SELECT barcode FROM copies WHERE copy_id = ?", [
      copyIds[0],
    ]);
    const librarian = await insertUser(db, "LIBRARIAN");
    const borrower = await insertUser(db, "STUDENT");
    const first = await insertUser(db, "STUDENT");
    const second = await insertUser(db, "STUDENT");

    const receipt = await issueCopy({
      memberIdentifier: await id(borrower),
      barcode: String(rows[0]?.barcode),
      actorId: librarian,
    });
    await placeHold({ bookId, memberId: first, role: "STUDENT" });
    await placeHold({ bookId, memberId: second, role: "STUDENT" });

    const forFirst = await waitForBook(bookId, first);
    expect(forFirst?.ahead).toBe(0);
    expect(forFirst?.date.toISOString().slice(0, 10)).toBe(receipt.dueAt.slice(0, 10));

    const forSecond = await waitForBook(bookId, second);
    expect(forSecond?.ahead).toBe(1);
    expect(forSecond?.date.getTime()).toBeGreaterThan(forFirst?.date.getTime() ?? 0);

    expect((await waitForBook(bookId, null))?.ahead).toBe(2);
  });

  it("has no estimate for a book with nothing on loan", async () => {
    const { bookId } = await insertStockedBook(db, 1);
    expect(await waitForBook(bookId, null)).toBeNull();
  });
});
