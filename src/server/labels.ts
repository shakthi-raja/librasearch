import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import QRCode from "qrcode";
import { labelUrl } from "@/lib/circulation/scan";
import { env } from "@/lib/config/env";
import { pool } from "@/server/db/pool";

export type Label = {
  barcode: string;
  title: string;
  editionNo: number;
  rack: string;
  shelf: string;
  /** An SVG data URI of the QR code that opens the copy's page. */
  qr: string;
};

async function qrDataUri(text: string) {
  const svg = await QRCode.toString(text, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Labels for every copy of a book, or for the listed barcodes, shelf order. */
export async function labelsFor(selection: { bookId?: number; barcodes?: string[] }) {
  const where = selection.bookId ? "e.book_id = ?" : "c.barcode IN (?)";
  const param = selection.bookId ?? selection.barcodes ?? [];
  if (Array.isArray(param) && param.length === 0) return [];

  const [rows] = await pool("librarian").query<RowDataPacket[]>(
    `SELECT c.barcode, c.rack_code, c.shelf_code, e.edition_no, b.title
       FROM copies c
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
      WHERE ${where} AND c.status <> 'WITHDRAWN'
      ORDER BY c.rack_code, c.shelf_code, c.barcode
      LIMIT 210`,
    [param],
  );
  return Promise.all(
    rows.map(
      async (row): Promise<Label> => ({
        barcode: String(row.barcode),
        title: String(row.title),
        editionNo: Number(row.edition_no),
        rack: String(row.rack_code),
        shelf: String(row.shelf_code),
        qr: await qrDataUri(labelUrl(env().APP_URL, String(row.barcode))),
      }),
    ),
  );
}
