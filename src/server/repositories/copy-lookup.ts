import "server-only";
import type { Pool, RowDataPacket } from "mysql2/promise";

export type CopyLookup = {
  copyId: number;
  barcode: string;
  status: "AVAILABLE" | "ON_LOAN" | "ON_HOLD_SHELF" | "LOST" | "DAMAGED";
  loanPolicy: string;
  rack: string;
  shelf: string;
  editionNo: number;
  pubYear: number;
  bookId: number;
  title: string;
  coverUrl: string | null;
  dueAt: Date | null;
};

export async function findCopyByBarcode(db: Pool, barcode: string): Promise<CopyLookup | null> {
  const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM v_copy_lookup WHERE barcode = ?", [
    barcode,
  ]);
  const row = rows[0];
  if (!row) return null;
  return {
    copyId: Number(row.copy_id),
    barcode: String(row.barcode),
    status: row.status as CopyLookup["status"],
    loanPolicy: String(row.loan_policy),
    rack: String(row.rack_code),
    shelf: String(row.shelf_code),
    editionNo: Number(row.edition_no),
    pubYear: Number(row.pub_year),
    bookId: Number(row.book_id),
    title: String(row.title),
    coverUrl: row.cover_url === null ? null : String(row.cover_url),
    dueAt: row.due_at === null ? null : new Date(row.due_at),
  };
}
