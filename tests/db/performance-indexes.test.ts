import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminConnection } from "../support/db";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

const indexColumns = async (table: string, index: string) => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT column_name FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?
      ORDER BY seq_in_index`,
    [table, index],
  );
  return rows.map((row) => String(row.COLUMN_NAME ?? row.column_name));
};

describe("performance indexes", () => {
  it("covers exam windows by offering and end date", async () => {
    expect(await indexColumns("exam_windows", "ix_exam_windows_offering_end")).toEqual([
      "offering_id",
      "end_date",
    ]);
  });

  it("covers the analytics window on loans", async () => {
    expect(await indexColumns("loans", "ix_loans_issued")).toEqual(["issued_at"]);
  });

  it("covers waiting holds", async () => {
    expect(await indexColumns("holds", "ix_holds_status")).toEqual(["status", "placed_at"]);
  });
});
