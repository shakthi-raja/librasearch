import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { compareRack, type StockCopy, type StockReport } from "@/lib/circulation/stocktake";
import { mapDbError } from "@/server/db/errors";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { AppError } from "@/server/http/errors";

const db = () => pool("librarian");

const COPY_SELECT = `
  SELECT c.copy_id, c.barcode, c.rack_code, c.shelf_code, c.status, b.title
    FROM copies c
    JOIN editions e ON e.edition_id = c.edition_id
    JOIN books b ON b.book_id = e.book_id`;

const toCopy = (row: RowDataPacket): StockCopy => ({
  copyId: Number(row.copy_id),
  barcode: String(row.barcode),
  title: String(row.title),
  rack: String(row.rack_code),
  shelf: String(row.shelf_code),
  status: String(row.status),
});

export type Stocktake = {
  stocktakeId: number;
  rack: string;
  startedAt: Date;
  closedAt: Date | null;
  scanned: number;
};

export async function listStocktakes(limit = 20): Promise<Stocktake[]> {
  const [rows] = await db().query<RowDataPacket[]>(
    `SELECT s.stocktake_id, s.rack_code, s.started_at, s.closed_at,
            (SELECT COUNT(*) FROM stocktake_scans x WHERE x.stocktake_id = s.stocktake_id) AS scanned
       FROM stocktakes s ORDER BY s.started_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map((row) => ({
    stocktakeId: Number(row.stocktake_id),
    rack: String(row.rack_code),
    startedAt: new Date(row.started_at),
    closedAt: row.closed_at === null ? null : new Date(row.closed_at),
    scanned: Number(row.scanned),
  }));
}

export async function startStocktake(rack: string, actorId: number): Promise<number> {
  const [result] = await db().query<ResultSetHeader>(
    "INSERT INTO stocktakes (rack_code, started_by) VALUES (?, ?)",
    [rack, actorId],
  );
  return result.insertId;
}

export type ScanOutcome = {
  copy: StockCopy;
  verdict: "FOUND" | "MISPLACED" | "UNEXPECTED";
  again: boolean;
};

/** Records one scanned copy and says at once what it means for this rack. */
export async function recordStockScan(stocktakeId: number, barcode: string): Promise<ScanOutcome> {
  const stocktake = await getStocktake(stocktakeId);
  const [rows] = await db().query<RowDataPacket[]>(`${COPY_SELECT} WHERE c.barcode = ?`, [barcode]);
  const row = rows[0];
  if (!row) throw new AppError("NOT_FOUND", "No copy has that barcode.");
  const copy = toCopy(row);
  let again = false;
  try {
    const [result] = await db().query<ResultSetHeader>(
      "INSERT IGNORE INTO stocktake_scans (stocktake_id, copy_id) VALUES (?, ?)",
      [stocktakeId, copy.copyId],
    );
    again = result.affectedRows === 0;
  } catch (error) {
    throw mapDbError(error);
  }
  const verdict =
    copy.rack !== stocktake.rack
      ? "MISPLACED"
      : copy.status === "AVAILABLE"
        ? "FOUND"
        : "UNEXPECTED";
  return { copy, verdict, again };
}

export async function getStocktake(stocktakeId: number): Promise<Stocktake> {
  const [rows] = await db().query<RowDataPacket[]>(
    `SELECT s.stocktake_id, s.rack_code, s.started_at, s.closed_at,
            (SELECT COUNT(*) FROM stocktake_scans x WHERE x.stocktake_id = s.stocktake_id) AS scanned
       FROM stocktakes s WHERE s.stocktake_id = ?`,
    [stocktakeId],
  );
  const row = rows[0];
  if (!row) throw new AppError("NOT_FOUND", "No such stocktake.");
  return {
    stocktakeId: Number(row.stocktake_id),
    rack: String(row.rack_code),
    startedAt: new Date(row.started_at),
    closedAt: row.closed_at === null ? null : new Date(row.closed_at),
    scanned: Number(row.scanned),
  };
}

export async function stocktakeReport(stocktakeId: number): Promise<StockReport> {
  const stocktake = await getStocktake(stocktakeId);
  const [[onRack], [scanned]] = await Promise.all([
    db().query<RowDataPacket[]>(
      `${COPY_SELECT} WHERE c.rack_code = ? AND c.status NOT IN ('WITHDRAWN')`,
      [stocktake.rack],
    ),
    db().query<RowDataPacket[]>(
      `${COPY_SELECT} JOIN stocktake_scans x ON x.copy_id = c.copy_id WHERE x.stocktake_id = ?`,
      [stocktakeId],
    ),
  ]);
  return compareRack(stocktake.rack, onRack.map(toCopy), scanned.map(toCopy));
}

/**
 * Closes the stocktake. Optionally the copies that should have been on the
 * rack but were not found become LOST, which the audit trigger records.
 */
export async function closeStocktake(
  stocktakeId: number,
  actorId: number,
  markMissingLost: boolean,
): Promise<number> {
  const report = await stocktakeReport(stocktakeId);
  return withTransaction(db(), async (conn) => {
    await conn.query("SET @app_user_id = ?", [actorId]);
    let marked = 0;
    if (markMissingLost && report.missing.length > 0) {
      const [result] = await conn.query<ResultSetHeader>(
        "UPDATE copies SET status = 'LOST' WHERE copy_id IN (?) AND status = 'AVAILABLE'",
        [report.missing.map((copy) => copy.copyId)],
      );
      marked = result.affectedRows;
    }
    await conn.query(
      "UPDATE stocktakes SET closed_at = NOW(3) WHERE stocktake_id = ? AND closed_at IS NULL",
      [stocktakeId],
    );
    return marked;
  });
}
