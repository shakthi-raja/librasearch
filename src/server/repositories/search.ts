import "server-only";
import type { Pool, RowDataPacket } from "mysql2/promise";

export type ChapterHit = {
  chapterId: number;
  chapterNo: number;
  title: string;
  summary: string;
  bookId: number;
  bookTitle: string;
  editionNo: number;
  pubYear: number;
  availableCopies: number;
  totalCopies: number;
  racks: string[];
  score: number;
};

export type BookHit = {
  bookId: number;
  title: string;
  authors: string;
  latestYear: number | null;
  availableCopies: number;
  totalCopies: number;
  racks: string[];
  score: number;
};

const racks = (value: unknown) => (value ? String(value).split(",") : []);

/** Chapters ranked by MySQL full-text relevance over title and summary. */
export async function keywordChapters(
  db: Pool,
  query: string,
  limit: number,
): Promise<ChapterHit[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT ch.chapter_id, ch.chapter_no, ch.title, ch.summary,
            b.book_id, b.title AS book_title, e.edition_no, e.pub_year,
            ea.available_copies, ea.total_copies, ba.racks,
            MATCH (ch.title, ch.summary) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
       FROM chapters ch
       JOIN editions e ON e.edition_id = ch.edition_id
       JOIN books b ON b.book_id = e.book_id AND b.status = 'ACTIVE'
       JOIN v_edition_availability ea ON ea.edition_id = e.edition_id
       JOIN v_book_availability ba ON ba.book_id = b.book_id
      WHERE MATCH (ch.title, ch.summary) AGAINST (? IN NATURAL LANGUAGE MODE)
      ORDER BY score DESC, e.pub_year DESC
      LIMIT ?`,
    [query, query, limit],
  );
  return rows.map((r) => ({
    chapterId: Number(r.chapter_id),
    chapterNo: Number(r.chapter_no),
    title: String(r.title),
    summary: String(r.summary),
    bookId: Number(r.book_id),
    bookTitle: String(r.book_title),
    editionNo: Number(r.edition_no),
    pubYear: Number(r.pub_year),
    availableCopies: Number(r.available_copies),
    totalCopies: Number(r.total_copies),
    racks: racks(r.racks),
    score: Number(r.score),
  }));
}

/** Books ranked by their own text, with author names counted as a match too. */
export async function keywordBooks(db: Pool, query: string, limit: number): Promise<BookHit[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT p.book_id, p.title, p.authors, p.latest_year, p.available_copies, p.total_copies, p.racks,
            MATCH (b.title, b.subtitle, b.description) AGAINST (? IN NATURAL LANGUAGE MODE)
            + COALESCE((
                SELECT MAX(MATCH (a.full_name) AGAINST (? IN NATURAL LANGUAGE MODE))
                  FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
                 WHERE ba.book_id = b.book_id
              ), 0) AS score
       FROM v_catalog_public p
       JOIN books b ON b.book_id = p.book_id
      WHERE MATCH (b.title, b.subtitle, b.description) AGAINST (? IN NATURAL LANGUAGE MODE)
         OR EXISTS (
              SELECT 1 FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
               WHERE ba.book_id = b.book_id AND MATCH (a.full_name) AGAINST (? IN NATURAL LANGUAGE MODE)
            )
      ORDER BY score DESC
      LIMIT ?`,
    [query, query, query, query, limit],
  );
  return rows.map((r) => ({
    bookId: Number(r.book_id),
    title: String(r.title),
    authors: String(r.authors ?? ""),
    latestYear: r.latest_year === null ? null : Number(r.latest_year),
    availableCopies: Number(r.available_copies),
    totalCopies: Number(r.total_copies),
    racks: racks(r.racks),
    score: Number(r.score),
  }));
}

export type SearchLogEntry = {
  userId: number | null;
  query: string;
  mode: "KEYWORD" | "SEMANTIC" | "HYBRID";
  filters: Record<string, unknown>;
  resultCount: number;
  topScore: number | null;
  latencyMs: number;
};

export async function logSearch(db: Pool, entry: SearchLogEntry) {
  await db.execute(
    `INSERT INTO search_log (user_id, query_text, mode, filters, result_count, top_score, latency_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.userId,
      entry.query.slice(0, 500),
      entry.mode,
      JSON.stringify(entry.filters),
      Math.min(entry.resultCount, 65_535),
      entry.topScore === null ? null : Math.round(entry.topScore * 10_000) / 10_000,
      entry.latencyMs,
    ],
  );
}
