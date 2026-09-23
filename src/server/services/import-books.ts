import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { type CategoryRef, type ImportPreview, importable, previewCsv } from "@/lib/catalogue/csv";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { insertBook, insertCopies, insertEdition } from "@/server/repositories/admin-catalog";

const MAX_ROWS = 200;

export async function categoryRefs(): Promise<CategoryRef[]> {
  const [rows] = await pool("librarian").query<RowDataPacket[]>(
    "SELECT category_id, name, slug FROM categories ORDER BY name",
  );
  return rows.map((row) => ({
    id: Number(row.category_id),
    name: String(row.name),
    slug: String(row.slug),
  }));
}

async function existingIsbns(): Promise<Set<string>> {
  const [rows] = await pool("librarian").query<RowDataPacket[]>("SELECT isbn13 FROM editions");
  return new Set(rows.map((row) => String(row.isbn13)));
}

export async function previewImport(text: string): Promise<ImportPreview> {
  const [categories, isbns] = await Promise.all([categoryRefs(), existingIsbns()]);
  const preview = previewCsv(text, categories, isbns);
  if (preview.rows.length > MAX_ROWS) {
    return { ...preview, error: `Import at most ${MAX_ROWS} rows at a time.` };
  }
  return preview;
}

export type ImportResult = { imported: number; skipped: number };

export async function importBooks(text: string, actorId: number): Promise<ImportResult> {
  const preview = await previewImport(text);
  if (preview.error) throw new Error(preview.error);
  const rows = importable(preview);
  if (rows.length === 0) throw new Error("There are no valid rows to import.");

  await withTransaction(pool("librarian"), async (conn) => {
    await conn.query("SET @app_user_id = ?", [actorId]);
    for (const row of rows) {
      const bookId = await insertBook(conn, {
        title: row.title,
        subtitle: null,
        categoryId: row.categoryId,
        description: "Added by a CSV import batch.",
        authors: row.authors,
      });
      const editionId = await insertEdition(conn, bookId, {
        isbn13: row.isbn13,
        editionNo: 1,
        pubYear: row.year,
        pageCount: 200,
        publisherId: null,
        format: "PAPERBACK",
      });
      await insertCopies(conn, {
        editionId,
        rack: "CS-04",
        shelf: "S1",
        count: row.copies,
        loanPolicy: "REGULAR",
      });
    }
  });

  return { imported: rows.length, skipped: preview.invalid };
}
