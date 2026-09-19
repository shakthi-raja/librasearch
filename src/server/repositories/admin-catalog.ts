import "server-only";
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

type Db = Pool | PoolConnection;

export type AdminBookRow = {
  bookId: number;
  title: string;
  status: "ACTIVE" | "WITHDRAWN";
  categoryPath: string;
  editions: number;
  copies: number;
};

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function listBooksAdmin(db: Db, q: string | undefined, limit: number, offset: number) {
  const where = q ? "WHERE b.title LIKE ?" : "";
  const params = q ? [`%${escapeLike(q)}%`] : [];
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT b.book_id, b.title, b.status, t.path,
            (SELECT COUNT(*) FROM editions e WHERE e.book_id = b.book_id) AS editions,
            (SELECT COUNT(*) FROM copies c JOIN editions e ON e.edition_id = c.edition_id
              WHERE e.book_id = b.book_id AND c.status <> 'WITHDRAWN') AS copies
       FROM books b JOIN v_category_tree t ON t.category_id = b.category_id
       ${where}
      ORDER BY b.title, b.book_id
      LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [count] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM books b ${where}`,
    params,
  );
  return {
    total: Number(count[0]?.n ?? 0),
    rows: rows.map(
      (r): AdminBookRow => ({
        bookId: Number(r.book_id),
        title: String(r.title),
        status: r.status as AdminBookRow["status"],
        categoryPath: String(r.path),
        editions: Number(r.editions),
        copies: Number(r.copies),
      }),
    ),
  };
}

export async function categoryOptions(db: Db) {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT category_id, path FROM v_category_tree ORDER BY path",
  );
  return rows.map((r) => ({ value: String(r.category_id), label: String(r.path) }));
}

export async function publisherOptions(db: Db) {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT publisher_id, name FROM publishers ORDER BY name",
  );
  return rows.map((r) => ({ value: String(r.publisher_id), label: String(r.name) }));
}

export type AdminBook = {
  bookId: number;
  title: string;
  subtitle: string | null;
  description: string;
  categoryId: number;
  status: "ACTIVE" | "WITHDRAWN";
  authors: string[];
  editions: {
    editionId: number;
    editionNo: number;
    isbn13: string;
    pubYear: number;
    copies: {
      copyId: number;
      accessionNo: string;
      barcode: string;
      rack: string;
      shelf: string;
      status: string;
      loanPolicy: string;
    }[];
  }[];
};

export async function findBookAdmin(db: Db, bookId: number): Promise<AdminBook | null> {
  const [books] = await db.query<RowDataPacket[]>(
    "SELECT book_id, title, subtitle, description, category_id, status FROM books WHERE book_id = ?",
    [bookId],
  );
  const b = books[0];
  if (!b) return null;
  const [authors] = await db.query<RowDataPacket[]>(
    `SELECT a.full_name FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
      WHERE ba.book_id = ? ORDER BY ba.author_order`,
    [bookId],
  );
  const [editions] = await db.query<RowDataPacket[]>(
    "SELECT edition_id, edition_no, isbn13, pub_year FROM editions WHERE book_id = ? ORDER BY edition_no DESC",
    [bookId],
  );
  const [copies] = await db.query<RowDataPacket[]>(
    `SELECT c.copy_id, c.edition_id, c.accession_no, c.barcode, c.rack_code, c.shelf_code, c.status, c.loan_policy
       FROM copies c JOIN editions e ON e.edition_id = c.edition_id
      WHERE e.book_id = ? ORDER BY c.copy_id`,
    [bookId],
  );
  return {
    bookId: Number(b.book_id),
    title: String(b.title),
    subtitle: b.subtitle === null ? null : String(b.subtitle),
    description: String(b.description),
    categoryId: Number(b.category_id),
    status: b.status as AdminBook["status"],
    authors: authors.map((a) => String(a.full_name)),
    editions: editions.map((e) => ({
      editionId: Number(e.edition_id),
      editionNo: Number(e.edition_no),
      isbn13: String(e.isbn13),
      pubYear: Number(e.pub_year),
      copies: copies
        .filter((c) => c.edition_id === e.edition_id)
        .map((c) => ({
          copyId: Number(c.copy_id),
          accessionNo: String(c.accession_no),
          barcode: String(c.barcode),
          rack: String(c.rack_code),
          shelf: String(c.shelf_code),
          status: String(c.status),
          loanPolicy: String(c.loan_policy),
        })),
    })),
  };
}

async function setAuthors(conn: PoolConnection, bookId: number, names: string[]) {
  await conn.query("DELETE FROM book_authors WHERE book_id = ?", [bookId]);
  for (const [i, name] of names.entries()) {
    const [found] = await conn.query<RowDataPacket[]>(
      "SELECT author_id FROM authors WHERE full_name = ? ORDER BY author_id LIMIT 1",
      [name],
    );
    let authorId = found[0]?.author_id as number | undefined;
    if (!authorId) {
      const [r] = await conn.query<ResultSetHeader>("INSERT INTO authors (full_name) VALUES (?)", [
        name,
      ]);
      authorId = r.insertId;
    }
    await conn.query(
      "INSERT INTO book_authors (book_id, author_id, author_order) VALUES (?, ?, ?)",
      [bookId, authorId, i + 1],
    );
  }
}

export type BookInput = {
  title: string;
  subtitle: string | null;
  categoryId: number;
  description: string;
  authors: string[];
};

export async function insertBook(conn: PoolConnection, input: BookInput) {
  const [r] = await conn.query<ResultSetHeader>(
    "INSERT INTO books (category_id, title, subtitle, description) VALUES (?, ?, ?, ?)",
    [input.categoryId, input.title, input.subtitle, input.description],
  );
  await setAuthors(conn, r.insertId, input.authors);
  return r.insertId;
}

export async function updateBook(conn: PoolConnection, bookId: number, input: BookInput) {
  await conn.query(
    "UPDATE books SET category_id = ?, title = ?, subtitle = ?, description = ? WHERE book_id = ?",
    [input.categoryId, input.title, input.subtitle, input.description, bookId],
  );
  await setAuthors(conn, bookId, input.authors);
}

export async function setBookStatus(db: Db, bookId: number, status: "ACTIVE" | "WITHDRAWN") {
  await db.query("UPDATE books SET status = ? WHERE book_id = ?", [status, bookId]);
}

export type EditionInput = {
  isbn13: string;
  editionNo: number;
  pubYear: number;
  pageCount: number;
  publisherId: number | null;
  format: "HARDCOVER" | "PAPERBACK";
};

/** Links the new edition to the latest earlier one of the same book. */
export async function insertEdition(conn: PoolConnection, bookId: number, input: EditionInput) {
  const [prev] = await conn.query<RowDataPacket[]>(
    "SELECT edition_id FROM editions WHERE book_id = ? AND edition_no < ? ORDER BY edition_no DESC LIMIT 1",
    [bookId, input.editionNo],
  );
  const [result] = await conn.query<ResultSetHeader>(
    `INSERT INTO editions (book_id, isbn13, edition_no, publisher_id, pub_year, page_count, format, previous_edition_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bookId,
      input.isbn13,
      input.editionNo,
      input.publisherId,
      input.pubYear,
      input.pageCount,
      input.format,
      prev[0]?.edition_id ?? null,
    ],
  );
  return result.insertId;
}

/**
 * Adds copies with the next accession numbers and barcodes. The table is
 * locked for numbering so two librarians receiving stock at once never draw
 * the same number; the unique keys back that up.
 */
export async function insertCopies(
  conn: PoolConnection,
  input: { editionId: number; rack: string; shelf: string; count: number; loanPolicy: string },
) {
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT COALESCE(MAX(CAST(SUBSTRING(barcode, 3) AS UNSIGNED)), 26000000) AS last FROM copies FOR UPDATE",
  );
  let next = Number(rows[0]?.last) + 1;
  const year = new Date().getUTCFullYear();
  for (let i = 0; i < input.count; i++, next++) {
    await conn.query(
      `INSERT INTO copies (edition_id, accession_no, barcode, rack_code, shelf_code, loan_policy, acquired_on)
       VALUES (?, ?, ?, ?, ?, ?, UTC_DATE())`,
      [
        input.editionId,
        `ACC-${year}-${String(next % 100_000).padStart(5, "0")}`,
        `LS${String(next).padStart(8, "0")}`,
        input.rack,
        input.shelf,
        input.loanPolicy,
      ],
    );
  }
}

/** Copies on loan or held for someone change state only through the desk. */
export async function updateCopyState(db: Db, copyId: number, status: string, loanPolicy: string) {
  const [r] = await db.query<ResultSetHeader>(
    `UPDATE copies SET status = ?, loan_policy = ?
      WHERE copy_id = ? AND status NOT IN ('ON_LOAN', 'ON_HOLD_SHELF')`,
    [status, loanPolicy, copyId],
  );
  return r.affectedRows === 1;
}
