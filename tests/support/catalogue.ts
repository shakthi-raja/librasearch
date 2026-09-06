import type { Connection, ResultSetHeader } from "mysql2/promise";
import { nextId } from "./fixtures";

/** Appends the ISBN-13 check digit to twelve digits. */
export function isbn13(first12: string) {
  const sum = [...first12].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return `${first12}${(10 - (sum % 10)) % 10}`;
}

export async function insertCategory(db: Connection, parentId: number | null = null) {
  const id = await nextId(db, "categories", "category_id");
  const [r] = await db.query<ResultSetHeader>(
    "INSERT INTO categories (parent_id, name, slug) VALUES (?, ?, ?)",
    [parentId, `Category ${id}`, `test-category-${id}`],
  );
  return r.insertId;
}

export async function insertBook(db: Connection, categoryId: number, title?: string) {
  title ??= `Test book ${await nextId(db, "books", "book_id")}`;
  const [r] = await db.query<ResultSetHeader>(
    "INSERT INTO books (category_id, title, description) VALUES (?, ?, ?)",
    [categoryId, title, "A book created by the test suite."],
  );
  return r.insertId;
}

export async function insertEdition(
  db: Connection,
  bookId: number,
  options: { editionNo?: number; previousEditionId?: number | null; pages?: number } = {},
) {
  const id = await nextId(db, "editions", "edition_id");
  const [r] = await db.query<ResultSetHeader>(
    `INSERT INTO editions (book_id, isbn13, edition_no, pub_year, page_count, previous_edition_id)
     VALUES (?, ?, ?, 2020, ?, ?)`,
    [
      bookId,
      isbn13(`979${String(100_000_000 + id).padStart(9, "0")}`),
      options.editionNo ?? 1,
      options.pages ?? 400,
      options.previousEditionId ?? null,
    ],
  );
  return r.insertId;
}

export async function insertCopy(
  db: Connection,
  editionId: number,
  options: { status?: string; loanPolicy?: string; rack?: string } = {},
) {
  const id = await nextId(db, "copies", "copy_id");
  const [r] = await db.query<ResultSetHeader>(
    `INSERT INTO copies (edition_id, accession_no, barcode, rack_code, shelf_code, status, loan_policy, acquired_on)
     VALUES (?, ?, ?, ?, 'S1', ?, ?, '2026-06-01')`,
    [
      editionId,
      `ACC-2026-${String(80_000 + id).padStart(5, "0")}`,
      `LS${String(90_000_000 + id)}`,
      options.rack ?? "CS-04",
      options.status ?? "AVAILABLE",
      options.loanPolicy ?? "REGULAR",
    ],
  );
  return r.insertId;
}

/** A book with one edition and the given number of available copies. */
export async function insertStockedBook(db: Connection, copies = 2) {
  const categoryId = await insertCategory(db);
  const bookId = await insertBook(db, categoryId);
  const editionId = await insertEdition(db, bookId);
  const copyIds: number[] = [];
  for (let i = 0; i < copies; i++) copyIds.push(await insertCopy(db, editionId));
  return { categoryId, bookId, editionId, copyIds };
}
