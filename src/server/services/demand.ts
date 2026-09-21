import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";

export type DemandRow = {
  offeringId: number;
  courseCode: string;
  courseTitle: string;
  termName: string;
  section: string;
  enrolled: number;
  nextExam: string | null;
  assignedBooks: number;
  usable: number;
  shortage: number;
};

const ASSIGNED_BOOKS = `
  SELECT DISTINCT b.book_id
    FROM syllabus_units u
    JOIN unit_chapter_map m ON m.unit_id = u.unit_id AND m.status = 'APPROVED'
    JOIN chapters ch ON ch.chapter_id = m.chapter_id
    JOIN editions ed ON ed.edition_id = ch.edition_id
    JOIN books b ON b.book_id = ed.book_id
   WHERE u.offering_id = o.offering_id AND b.status = 'ACTIVE'`;

export async function shortagePlanner(): Promise<DemandRow[]> {
  const [rows] = await pool("librarian").query<RowDataPacket[]>(
    `SELECT o.offering_id, c.course_code, c.title AS course_title,
            t.name AS term_name, o.section,
            (SELECT COUNT(*) FROM enrollments e
              WHERE e.offering_id = o.offering_id AND e.status = 'ENROLLED') AS enrolled,
            (SELECT MIN(ew.start_date) FROM exam_windows ew
              WHERE ew.offering_id = o.offering_id AND ew.end_date >= CURDATE()) AS next_exam,
            (SELECT COUNT(DISTINCT b.book_id)
               FROM syllabus_units u
               JOIN unit_chapter_map m ON m.unit_id = u.unit_id AND m.status = 'APPROVED'
               JOIN chapters ch ON ch.chapter_id = m.chapter_id
               JOIN editions ed ON ed.edition_id = ch.edition_id
               JOIN books b ON b.book_id = ed.book_id
              WHERE u.offering_id = o.offering_id AND b.status = 'ACTIVE') AS assigned_books,
            (SELECT COUNT(*) FROM copies cp
               JOIN editions ed ON ed.edition_id = cp.edition_id
              WHERE ed.book_id IN (${ASSIGNED_BOOKS})
                AND cp.status = 'AVAILABLE' AND cp.loan_policy <> 'REFERENCE_ONLY') AS usable
       FROM course_offerings o
       JOIN courses c ON c.course_id = o.course_id
       JOIN academic_terms t ON t.term_id = o.term_id
      WHERE o.status IN ('PLANNED', 'RUNNING')
      ORDER BY next_exam IS NULL, next_exam, c.course_code, o.section`,
  );

  return rows.map((row) => {
    const enrolled = Number(row.enrolled);
    const usable = Number(row.usable);
    return {
      offeringId: Number(row.offering_id),
      courseCode: row.course_code,
      courseTitle: row.course_title,
      termName: row.term_name,
      section: row.section,
      enrolled,
      nextExam: row.next_exam ? String(row.next_exam) : null,
      assignedBooks: Number(row.assigned_books),
      usable,
      shortage: Math.max(0, enrolled - usable),
    };
  });
}
