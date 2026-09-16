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
