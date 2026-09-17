import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";
import { AppError } from "@/server/http/errors";
import { embedQuery } from "@/server/vector/embedding";
import { qdrant } from "@/server/vector/qdrant";

export type FacultyUnit = {
  unitId: number;
  unitNo: number;
  title: string;
  topics: string;
  hours: number;
  courseCode: string;
  courseTitle: string;
  section: string;
  termName: string;
  suggestions: number;
  approved: number;
};

type UnitRow = RowDataPacket & {
  unit_id: number;
  unit_no: number;
  title: string;
  topics: string;
  hours: number;
  course_code: string;
  course_title: string;
  section: string;
  term_name: string;
  suggestions: number;
  approved: number;
};

const toUnit = (row: UnitRow): FacultyUnit => ({
  unitId: Number(row.unit_id),
  unitNo: Number(row.unit_no),
  title: row.title,
  topics: row.topics,
  hours: Number(row.hours),
  courseCode: row.course_code,
  courseTitle: row.course_title,
  section: row.section,
  termName: row.term_name,
  suggestions: Number(row.suggestions),
  approved: Number(row.approved),
});

const UNIT_SELECT = `
  SELECT u.unit_id, u.unit_no, u.title, u.topics, u.hours,
         c.course_code, c.title AS course_title, o.section, t.name AS term_name,
         (SELECT COUNT(*) FROM unit_chapter_map m
           WHERE m.unit_id = u.unit_id AND m.status = 'SUGGESTED') AS suggestions,
         (SELECT COUNT(*) FROM unit_chapter_map m
           WHERE m.unit_id = u.unit_id AND m.status = 'APPROVED') AS approved
    FROM syllabus_units u
    JOIN course_offerings o ON o.offering_id = u.offering_id
    JOIN courses c ON c.course_id = o.course_id
    JOIN academic_terms t ON t.term_id = o.term_id`;

export async function facultyUnits(userId: number) {
  const [rows] = await pool("faculty").query<UnitRow[]>(
    `${UNIT_SELECT} WHERE o.coordinator_id = ?
     ORDER BY t.start_date DESC, c.course_code, u.unit_no`,
    [userId],
  );
  return rows.map(toUnit);
}

export async function facultyUnit(unitId: number, userId: number) {
  const [rows] = await pool("faculty").query<UnitRow[]>(
    `${UNIT_SELECT} WHERE u.unit_id = ? AND o.coordinator_id = ?`,
    [unitId, userId],
  );
  const row = rows[0];
  if (!row) throw new AppError("NOT_FOUND", "That unit is not yours.");
  return toUnit(row);
}

export type UnitMapping = {
  chapterId: number;
  chapterNo: number;
  chapterTitle: string;
  bookId: number;
  bookTitle: string;
  authors: string;
  similarity: number;
  source: "AUTO" | "MANUAL";
  status: "SUGGESTED" | "APPROVED" | "REJECTED";
};

export type CoverageRow = {
  courseCode: string;
  courseTitle: string;
  termName: string;
  section: string;
  units: number;
  covered: number;
};

/** Searches the chapter collection with the unit text and stores suggestions. */
export async function suggestChapters(unitId: number, userId: number) {
  const unit = await facultyUnit(unitId, userId);
  const db = pool("faculty");
  const vector = await embedQuery(
    `${unit.courseTitle}. Unit ${unit.unitNo}: ${unit.title}. ${unit.topics}`,
  );

  const result = await qdrant().query("chapters", {
    query: vector,
    limit: 8,
    score_threshold: 0.45,
    with_payload: false,
  });

  for (const point of result.points) {
    await db.query(
      `INSERT INTO unit_chapter_map (unit_id, chapter_id, similarity, source, status)
       VALUES (?, ?, ?, 'AUTO', 'SUGGESTED')
       ON DUPLICATE KEY UPDATE similarity = VALUES(similarity)`,
      [unitId, Number(point.id), point.score],
    );
  }

  return result.points.length;
}

export async function unitMappings(unitId: number, userId: number): Promise<UnitMapping[]> {
  await facultyUnit(unitId, userId);
  const [rows] = await pool("faculty").query<RowDataPacket[]>(
    `SELECT m.chapter_id, m.similarity, m.source, m.status,
            c.chapter_no, c.title AS chapter_title, b.book_id, b.title AS book_title,
            (SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
               FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
              WHERE ba.book_id = b.book_id) AS authors
       FROM unit_chapter_map m
       JOIN chapters c ON c.chapter_id = m.chapter_id
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
      WHERE m.unit_id = ?
      ORDER BY m.similarity DESC, c.chapter_no`,
    [unitId],
  );
  return rows.map(
    (row) =>
      ({
        chapterId: Number(row.chapter_id),
        chapterNo: Number(row.chapter_no),
        chapterTitle: row.chapter_title,
        bookId: Number(row.book_id),
        bookTitle: row.book_title,
        authors: row.authors ?? "",
        similarity: Number(row.similarity),
        source: row.source,
        status: row.status,
      }) satisfies UnitMapping,
  );
}

export async function reviewMapping(
  unitId: number,
  chapterId: number,
  status: "APPROVED" | "REJECTED",
  userId: number,
) {
  const [result] = await pool("faculty").query(
    `UPDATE unit_chapter_map m
       JOIN syllabus_units u ON u.unit_id = m.unit_id
       JOIN course_offerings o ON o.offering_id = u.offering_id
        SET m.status = ?, m.reviewed_by = ?, m.reviewed_at = NOW(3)
      WHERE m.unit_id = ? AND m.chapter_id = ? AND o.coordinator_id = ?`,
    [status, userId, unitId, chapterId, userId],
  );
  if ((result as { affectedRows: number }).affectedRows === 0) {
    throw new AppError("NOT_FOUND", "That mapping could not be reviewed.");
  }
}

export async function facultyCoverage(userId: number): Promise<CoverageRow[]> {
  const [rows] = await pool("faculty").query<RowDataPacket[]>(
    `SELECT c.course_code, c.title AS course_title, t.name AS term_name, o.section,
            COUNT(DISTINCT u.unit_id) AS units,
            COUNT(DISTINCT CASE WHEN m.status = 'APPROVED' THEN u.unit_id END) AS covered
       FROM syllabus_units u
       JOIN course_offerings o ON o.offering_id = u.offering_id
       JOIN courses c ON c.course_id = o.course_id
       JOIN academic_terms t ON t.term_id = o.term_id
       LEFT JOIN unit_chapter_map m ON m.unit_id = u.unit_id
      WHERE o.coordinator_id = ?
      GROUP BY c.course_id, c.course_code, c.title, t.name, o.section, t.start_date
      ORDER BY t.start_date DESC, c.course_code`,
    [userId],
  );
  return rows.map(
    (row) =>
      ({
        courseCode: row.course_code,
        courseTitle: row.course_title,
        termName: row.term_name,
        section: row.section,
        units: Number(row.units),
        covered: Number(row.covered),
      }) satisfies CoverageRow,
  );
}
