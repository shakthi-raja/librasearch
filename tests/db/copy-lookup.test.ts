import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { findCopyByBarcode } from "@/server/repositories/copy-lookup";
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

const barcodeOf = async (copyId: number) => {
  const [rows] = await db.query<RowDataPacket[]>("SELECT barcode FROM copies WHERE copy_id = ?", [
    copyId,
  ]);
  return String(rows[0]?.barcode);
};

describe("v_copy_lookup", () => {
  it("shows a student where a copy belongs and that it is in", async () => {
    const { copyIds, bookId } = await insertStockedBook(db, 1);
    const copy = await findCopyByBarcode(pool("student"), await barcodeOf(copyIds[0] as number));
    expect(copy).toMatchObject({ bookId, status: "AVAILABLE", rack: "CS-04", dueAt: null });
  });

  it("gives the due date of a copy that is out, never the borrower", async () => {
    const { copyIds } = await insertStockedBook(db, 1);
    const copyId = copyIds[0] as number;
    const member = await insertUser(db, "STUDENT");
    const librarian = await insertUser(db, "LIBRARIAN");
    await db.query(
      `INSERT INTO loans (copy_id, member_id, issued_by, due_at)
       VALUES (?, ?, ?, NOW(3) + INTERVAL 14 DAY)`,
      [copyId, member, librarian],
    );
    await db.query("UPDATE copies SET status = 'ON_LOAN' WHERE copy_id = ?", [copyId]);

    const copy = await findCopyByBarcode(pool("student"), await barcodeOf(copyId));
    expect(copy?.status).toBe("ON_LOAN");
    expect(copy?.dueAt).toBeInstanceOf(Date);

    const [columns] = await db.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'v_copy_lookup'`,
    );
    expect(columns.map((c) => c.COLUMN_NAME)).not.toContain("member_id");
  });

  it("knows nothing of an unknown barcode", async () => {
    expect(await findCopyByBarcode(pool("student"), "LS00000000")).toBeNull();
  });
});
