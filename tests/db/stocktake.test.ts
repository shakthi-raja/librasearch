import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  closeStocktake,
  recordStockScan,
  startStocktake,
  stocktakeReport,
} from "@/server/services/stocktake";
import { insertBook, insertCategory, insertCopy, insertEdition } from "../support/catalogue";
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

const barcode = async (copyId: number) => {
  const [rows] = await db.query<RowDataPacket[]>("SELECT barcode FROM copies WHERE copy_id = ?", [
    copyId,
  ]);
  return String(rows[0]?.barcode);
};

// a rack of our own so other tests' copies never show up in the report
const rack = `ZZ-${String(10 + (Date.now() % 89))}`;

describe("stocktake", () => {
  it("finds, misses and misplaces copies, then marks the missing ones lost", async () => {
    const edition = await insertEdition(db, await insertBook(db, await insertCategory(db)));
    const here = await insertCopy(db, edition, { rack });
    const gone = await insertCopy(db, edition, { rack });
    const stray = await insertCopy(db, edition, { rack: "MA-02" });

    const id = await startStocktake(rack, librarian);
    expect((await recordStockScan(id, await barcode(here))).verdict).toBe("FOUND");
    expect((await recordStockScan(id, await barcode(stray))).verdict).toBe("MISPLACED");
    expect((await recordStockScan(id, await barcode(here))).again).toBe(true);

    const report = await stocktakeReport(id);
    expect(report.found.map((c) => c.copyId)).toEqual([here]);
    expect(report.missing.map((c) => c.copyId)).toEqual([gone]);
    expect(report.misplaced.map((c) => c.copyId)).toEqual([stray]);

    expect(await closeStocktake(id, librarian, true)).toBe(1);
    const [rows] = await db.query<RowDataPacket[]>("SELECT status FROM copies WHERE copy_id = ?", [
      gone,
    ]);
    expect(rows[0]?.status).toBe("LOST");

    await expect(recordStockScan(id, await barcode(here))).rejects.toThrow(/closed/);
  });

  it("refuses an unknown barcode", async () => {
    const id = await startStocktake(rack, librarian);
    await expect(recordStockScan(id, "LS00000000")).rejects.toThrow(/No copy/);
  });
});
