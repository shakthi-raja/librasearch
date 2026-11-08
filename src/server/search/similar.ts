import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";
import { collection, qdrant } from "@/server/vector/qdrant";

export type SimilarBook = {
  bookId: number;
  title: string;
  authors: string;
  similarity: number;
  available: number;
  rack: string | null;
};

export type AlternativeChapter = {
  chapterId: number;
  bookId: number;
  bookTitle: string;
  chapterNo: number;
  chapterTitle: string;
  similarity: number;
  rack: string | null;
  shelf: string | null;
};

/** Book-vector neighbours, excluding the book itself. */
export async function similarBooks(bookId: number, limit = 6): Promise<SimilarBook[]> {
  const db = pool("student");
  const [book] = await qdrant().retrieve(collection("books"), { ids: [bookId], with_vector: true });
  if (!book || !Array.isArray(book.vector)) return [];

  const result = await qdrant().query(collection("books"), {
    query: book.vector,
    limit: limit + 1,
    with_payload: false,
  });

  const scores = new Map<number, number>();
  for (const point of result.points) {
    const id = Number(point.id);
    if (id !== bookId) scores.set(id, point.score);
  }
  const ids = [...scores.keys()].slice(0, limit);
  if (ids.length === 0) return [];

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT b.book_id, b.title,
            (SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
               FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
              WHERE ba.book_id = b.book_id) AS authors,
            fn_available_copies(b.book_id) AS available,
            (SELECT MIN(cp.rack_code) FROM copies cp
               JOIN editions e ON e.edition_id = cp.edition_id
              WHERE e.book_id = b.book_id AND cp.status = 'AVAILABLE'
                AND cp.loan_policy <> 'REFERENCE_ONLY') AS rack
       FROM books b
      WHERE b.book_id IN (?) AND b.status = 'ACTIVE'`,
    [ids],
  );

  return rows
    .map((row) => ({
      bookId: Number(row.book_id),
      title: row.title,
      authors: row.authors ?? "",
      similarity: scores.get(Number(row.book_id)) ?? 0,
      available: Number(row.available),
      rack: row.rack ?? null,
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

/** Chapters near this one, excluding its own book, with a copy on the shelf. */
export async function alternativeChapters(
  chapterId: number,
  limit = 4,
): Promise<AlternativeChapter[]> {
  const db = pool("student");
  const [own] = await db.query<RowDataPacket[]>(
    `SELECT e.book_id FROM chapters c
       JOIN editions e ON e.edition_id = c.edition_id
      WHERE c.chapter_id = ?`,
    [chapterId],
  );
  const ownBook = Number(own[0]?.book_id);
  if (!Number.isInteger(ownBook)) return [];

  const [chapter] = await qdrant().retrieve(collection("chapters"), {
    ids: [chapterId],
    with_vector: true,
  });
  if (!chapter || !Array.isArray(chapter.vector)) return [];

  const result = await qdrant().query(collection("chapters"), {
    query: chapter.vector,
    limit: 24,
    with_payload: false,
  });
  const scores = new Map<number, number>(
    result.points.map((point): [number, number] => [Number(point.id), point.score]),
  );
  const ids = [...scores.keys()].filter((id) => id !== chapterId);
  if (ids.length === 0) return [];

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT c.chapter_id, c.chapter_no, c.title AS chapter_title,
            e.edition_id, e.book_id, b.title AS book_title,
            (SELECT COUNT(*) FROM copies cp
              WHERE cp.edition_id = e.edition_id AND cp.status = 'AVAILABLE'
                AND cp.loan_policy <> 'REFERENCE_ONLY') AS available,
            (SELECT MIN(cp.rack_code) FROM copies cp
              WHERE cp.edition_id = e.edition_id AND cp.status = 'AVAILABLE'
                AND cp.loan_policy <> 'REFERENCE_ONLY') AS rack,
            (SELECT MIN(cp.shelf_code) FROM copies cp
              WHERE cp.edition_id = e.edition_id AND cp.status = 'AVAILABLE'
                AND cp.loan_policy <> 'REFERENCE_ONLY') AS shelf
       FROM chapters c
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
      WHERE c.chapter_id IN (?) AND b.book_id <> ? AND b.status = 'ACTIVE'`,
    [ids, ownBook],
  );

  return rows
    .map((row) => ({
      chapterId: Number(row.chapter_id),
      bookId: Number(row.book_id),
      bookTitle: row.book_title,
      chapterNo: Number(row.chapter_no),
      chapterTitle: row.chapter_title,
      similarity: scores.get(Number(row.chapter_id)) ?? 0,
      available: Number(row.available),
      rack: row.rack ?? null,
      shelf: row.shelf ?? null,
    }))
    .filter((row) => row.available > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
