import "server-only";
import type { Pool, RowDataPacket } from "mysql2/promise";

export type CopyState =
  | "AVAILABLE"
  | "ON_LOAN"
  | "ON_HOLD_SHELF"
  | "LOST"
  | "DAMAGED"
  | "WITHDRAWN";

export type BookDetail = {
  bookId: number;
  title: string;
  subtitle: string | null;
  description: string;
  authors: string;
  categoryPath: string;
  categorySlug: string;
  coverUrl: string | null;
  openResources: { url: string; kind: string; provider: string; licence: string | null }[];
  editions: {
    editionId: number;
    editionNo: number;
    isbn13: string;
    pubYear: number;
    pageCount: number;
    publisher: string | null;
    chapters: {
      chapterId: number;
      chapterNo: number;
      title: string;
      summary: string;
      pageStart: number;
      pageEnd: number;
    }[];
    copies: {
      copyId: number;
      rack: string;
      shelf: string;
      status: CopyState;
      loanPolicy: string;
    }[];
  }[];
};

/** A book with every edition, its chapters and copies, newest edition first. */
export async function findBook(db: Pool, bookId: number): Promise<BookDetail | null> {
  const [books] = await db.query<RowDataPacket[]>(
    `SELECT p.book_id, p.title, p.subtitle, p.description, p.authors, p.category_path, p.category_slug,
            p.cover_url
       FROM v_catalog_public p WHERE p.book_id = ?`,
    [bookId],
  );
  const book = books[0];
  if (!book) return null;

  const [editions, chapters, copies, open] = await Promise.all([
    db.query<RowDataPacket[]>(
      `SELECT e.edition_id, e.edition_no, e.isbn13, e.pub_year, e.page_count, pb.name AS publisher
         FROM editions e LEFT JOIN publishers pb ON pb.publisher_id = e.publisher_id
        WHERE e.book_id = ? ORDER BY e.edition_no DESC`,
      [bookId],
    ),
    db.query<RowDataPacket[]>(
      `SELECT ch.chapter_id, ch.edition_id, ch.chapter_no, ch.title, ch.summary, ch.page_start, ch.page_end
         FROM chapters ch JOIN editions e ON e.edition_id = ch.edition_id
        WHERE e.book_id = ? ORDER BY ch.chapter_no`,
      [bookId],
    ),
    db.query<RowDataPacket[]>(
      `SELECT c.copy_id, c.edition_id, c.rack_code, c.shelf_code, c.status, c.loan_policy
         FROM copies c JOIN editions e ON e.edition_id = c.edition_id
        WHERE e.book_id = ? AND c.status <> 'WITHDRAWN' ORDER BY c.copy_id`,
      [bookId],
    ),
    db.query<RowDataPacket[]>(
      "SELECT url, kind, provider, licence FROM v_open_shelf WHERE book_id = ? ORDER BY resource_id",
      [bookId],
    ),
  ]);

  return {
    bookId: Number(book.book_id),
    title: String(book.title),
    subtitle: book.subtitle === null ? null : String(book.subtitle),
    description: String(book.description),
    authors: String(book.authors ?? ""),
    categoryPath: String(book.category_path),
    categorySlug: String(book.category_slug),
    coverUrl: book.cover_url === null ? null : String(book.cover_url),
    openResources: open[0].map((r) => ({
      url: String(r.url),
      kind: String(r.kind),
      provider: String(r.provider),
      licence: r.licence === null ? null : String(r.licence),
    })),
    editions: editions[0].map((e) => ({
      editionId: Number(e.edition_id),
      editionNo: Number(e.edition_no),
      isbn13: String(e.isbn13),
      pubYear: Number(e.pub_year),
      pageCount: Number(e.page_count),
      publisher: e.publisher === null ? null : String(e.publisher),
      chapters: chapters[0]
        .filter((c) => c.edition_id === e.edition_id)
        .map((c) => ({
          chapterId: Number(c.chapter_id),
          chapterNo: Number(c.chapter_no),
          title: String(c.title),
          summary: String(c.summary),
          pageStart: Number(c.page_start),
          pageEnd: Number(c.page_end),
        })),
      copies: copies[0]
        .filter((c) => c.edition_id === e.edition_id)
        .map((c) => ({
          copyId: Number(c.copy_id),
          rack: String(c.rack_code),
          shelf: String(c.shelf_code),
          status: c.status as CopyState,
          loanPolicy: String(c.loan_policy),
        })),
    })),
  };
}
