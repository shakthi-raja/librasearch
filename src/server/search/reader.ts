import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { EMPTY_CONTEXT, type ReaderContext, type SyllabusLink } from "@/lib/search/personalise";
import { pool } from "@/server/db/pool";
import type { RoleName } from "@/server/repositories/auth";

/**
 * The reader's running courses: a student's enrollments, a teacher's own
 * offerings. Librarians and guests search without a syllabus.
 */
export async function readerContext(
  reader: { userId: number; role: RoleName } | null,
): Promise<ReaderContext> {
  if (!reader || reader.role === "LIBRARIAN") return EMPTY_CONTEXT;
  const db = pool(reader.role === "FACULTY" ? "faculty" : "student");

  const mine =
    reader.role === "FACULTY"
      ? `SELECT o.offering_id FROM course_offerings o
          WHERE o.coordinator_id = ? AND o.status = 'RUNNING'`
      : `SELECT e.offering_id FROM enrollments e
           JOIN course_offerings o ON o.offering_id = e.offering_id AND o.status = 'RUNNING'
          WHERE e.student_id = ? AND e.status = 'ENROLLED'`;

  const [[chapters], [books]] = await Promise.all([
    db.query<RowDataPacket[]>(
      `SELECT r.chapter_id, r.course_code, r.unit_no, r.unit_title
         FROM v_course_reading_list r
        WHERE r.offering_id IN (${mine})
        ORDER BY r.unit_no`,
      [reader.userId],
    ),
    db.query<RowDataPacket[]>(
      `SELECT cb.book_id, c.course_code
         FROM course_books cb
         JOIN courses c ON c.course_id = cb.course_id
         JOIN course_offerings o ON o.course_id = cb.course_id
        WHERE o.offering_id IN (${mine})
        ORDER BY cb.role, cb.position`,
      [reader.userId],
    ),
  ]);

  const chapterMap = new Map<number, SyllabusLink>();
  for (const row of chapters) {
    const id = Number(row.chapter_id);
    if (!chapterMap.has(id)) {
      chapterMap.set(id, {
        courseCode: String(row.course_code),
        unitNo: Number(row.unit_no),
        unitTitle: String(row.unit_title),
      });
    }
  }
  const bookMap = new Map<number, string[]>();
  for (const row of books) {
    const id = Number(row.book_id);
    const codes = bookMap.get(id) ?? [];
    if (!codes.includes(String(row.course_code))) codes.push(String(row.course_code));
    bookMap.set(id, codes);
  }
  return { chapters: chapterMap, books: bookMap };
}
