import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";

export type CourseCard = {
  code: string;
  title: string;
  semester: number;
  description: string | null;
  units: { unitNo: number; title: string }[];
  books: { bookId: number; title: string; role: "TEXTBOOK" | "REFERENCE"; available: number }[];
};

/** A course looked up by its code, with its latest units and prescribed books. */
export async function courseByCode(code: string): Promise<CourseCard | null> {
  const db = pool("student");
  const [courses] = await db.query<RowDataPacket[]>(
    "SELECT course_id, course_code, title, semester, description FROM courses WHERE course_code = ?",
    [code],
  );
  const course = courses[0];
  if (!course) return null;

  const [units] = await db.query<RowDataPacket[]>(
    `SELECT su.unit_no, su.title FROM syllabus_units su
       JOIN course_offerings o ON o.offering_id = su.offering_id
      WHERE o.course_id = ?
        AND o.term_id = (SELECT MAX(o2.term_id) FROM course_offerings o2 WHERE o2.course_id = o.course_id)
      ORDER BY su.unit_no`,
    [course.course_id],
  );
  const [books] = await db.query<RowDataPacket[]>(
    `SELECT book_id, book_title, role, available_copies FROM v_prescribed_books
      WHERE course_id = ? ORDER BY role, position`,
    [course.course_id],
  );

  return {
    code: String(course.course_code),
    title: String(course.title),
    semester: Number(course.semester),
    description: course.description === null ? null : String(course.description),
    units: units.map((u) => ({ unitNo: Number(u.unit_no), title: String(u.title) })),
    books: books.map((b) => ({
      bookId: Number(b.book_id),
      title: String(b.book_title),
      role: b.role as "TEXTBOOK" | "REFERENCE",
      available: Number(b.available_copies),
    })),
  };
}
