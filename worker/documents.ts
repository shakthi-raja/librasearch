import type { Pool, RowDataPacket } from "mysql2/promise";
import type { CollectionName } from "@/server/vector/qdrant";

export type Document = {
  collection: CollectionName;
  id: number;
  text: string;
  payload: Record<string, unknown>;
};

const authors = `(SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
                    FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
                   WHERE ba.book_id = b.book_id)`;

const first = (rows: RowDataPacket[]) => rows[0];

export async function chapterDocument(db: Pool, chapterId: number): Promise<Document | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT c.chapter_id, c.chapter_no, c.title, c.summary, c.page_start, c.page_end,
            e.edition_id, e.edition_no, e.pub_year, e.book_id, b.title AS book_title,
            b.language, b.category_id, ${authors} AS book_authors
       FROM chapters c
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
      WHERE c.chapter_id = ?`,
    [chapterId],
  );
  const row = first(rows);
  if (!row) return null;

  return {
    collection: "chapters",
    id: chapterId,
    text: `${row.book_title}. Chapter ${row.chapter_no}: ${row.title}. ${row.summary}`,
    payload: {
      chapter_id: Number(row.chapter_id),
      book_id: Number(row.book_id),
      edition_id: Number(row.edition_id),
      category_id: Number(row.category_id),
      language: row.language,
      pub_year: Number(row.pub_year),
      chapter_no: Number(row.chapter_no),
      page_start: Number(row.page_start),
      page_end: Number(row.page_end),
    },
  };
}

export async function bookDocument(db: Pool, bookId: number): Promise<Document | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT b.book_id, b.title, b.subtitle, b.description, b.language, b.category_id,
            ${authors} AS book_authors,
            (SELECT t.path FROM v_category_tree t WHERE t.category_id = b.category_id) AS category_path,
            (SELECT COUNT(*) FROM editions e WHERE e.book_id = b.book_id) AS edition_count,
            (SELECT MAX(e.pub_year) FROM editions e WHERE e.book_id = b.book_id) AS pub_year
       FROM books b
      WHERE b.book_id = ?`,
    [bookId],
  );
  const row = first(rows);
  if (!row) return null;

  return {
    collection: "books",
    id: bookId,
    text: [row.title, row.subtitle, row.book_authors, row.description, row.category_path]
      .filter(Boolean)
      .join(". "),
    payload: {
      book_id: Number(row.book_id),
      category_id: Number(row.category_id),
      language: row.language,
      pub_year: row.pub_year ? Number(row.pub_year) : null,
      edition_count: Number(row.edition_count),
    },
  };
}

export async function unitDocument(db: Pool, unitId: number): Promise<Document | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT u.unit_id, u.unit_no, u.title, u.topics, u.hours, u.offering_id,
            o.course_id, o.term_id, co.title AS course_title, co.dept_id, co.semester
       FROM syllabus_units u
       JOIN course_offerings o ON o.offering_id = u.offering_id
       JOIN courses co ON co.course_id = o.course_id
      WHERE u.unit_id = ?`,
    [unitId],
  );
  const row = first(rows);
  if (!row) return null;

  return {
    collection: "syllabus_units",
    id: unitId,
    text: `${row.course_title}. Unit ${row.unit_no}: ${row.title}. ${row.topics}`,
    payload: {
      unit_id: Number(row.unit_id),
      offering_id: Number(row.offering_id),
      course_id: Number(row.course_id),
      dept_id: Number(row.dept_id),
      term_id: Number(row.term_id),
      semester: Number(row.semester),
    },
  };
}

export async function editionChapterIds(db: Pool, editionId: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT chapter_id FROM chapters WHERE edition_id = ? ORDER BY chapter_id",
    [editionId],
  );
  return rows.map((row) => Number(row.chapter_id));
}

/** The document for a catalogue entity; null when the row has gone. */
export async function documentFor(db: Pool, entityType: string, entityId: number) {
  if (entityType === "CHAPTER") return chapterDocument(db, entityId);
  if (entityType === "BOOK") return bookDocument(db, entityId);
  if (entityType === "UNIT") return unitDocument(db, entityId);
  return null;
}
