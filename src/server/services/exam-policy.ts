import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { AppError } from "@/server/http/errors";

export type ExamPolicy = "SHORT_LOAN" | "REFERENCE_ONLY";

export type ExamWindowRow = {
  examId: number;
  offeringId: number;
  courseCode: string;
  courseTitle: string;
  termName: string;
  section: string;
  examType: string;
  startsOn: string;
  endsOn: string;
  copies: number;
  active: number;
  appliedPolicy: ExamPolicy | null;
};

export type ApplyResult = { applied: number; skipped: number; policy: ExamPolicy };

const READING_LIST_COPIES = `
  SELECT DISTINCT c.copy_id, c.loan_policy, c.status
    FROM syllabus_units u
    JOIN unit_chapter_map m ON m.unit_id = u.unit_id AND m.status = 'APPROVED'
    JOIN chapters ch ON ch.chapter_id = m.chapter_id
    JOIN editions ed ON ed.edition_id = ch.edition_id
    JOIN copies c ON c.edition_id = ed.edition_id
   WHERE u.offering_id = ?`;

/**
 * Restores the lending policy of copies whose exam window has closed. Called
 * lazily whenever the desk opens the exams or demand page, so a forgotten
 * policy cannot keep a book on short loan forever.
 */
export async function expireExamPolicies(): Promise<number> {
  return withTransaction(pool("librarian"), async (conn) => {
    await conn.query("SET @app_user_id = NULL");
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT override_id, copy_id, previous_policy
         FROM policy_overrides
        WHERE reverted_at IS NULL AND ends_on < CURDATE()
        FOR UPDATE`,
    );
    if (rows.length === 0) return 0;

    for (const row of rows) {
      await conn.query("UPDATE copies SET loan_policy = ? WHERE copy_id = ?", [
        row.previous_policy,
        row.copy_id,
      ]);
    }
    await conn.query("UPDATE policy_overrides SET reverted_at = NOW(3) WHERE override_id IN (?)", [
      rows.map((row) => Number(row.override_id)),
    ]);
    return rows.length;
  });
}

/** Exam windows that have not closed, with their current override state. */
export async function examWindows(): Promise<ExamWindowRow[]> {
  await expireExamPolicies();
  const [rows] = await pool("librarian").query<RowDataPacket[]>(
    `SELECT e.exam_id, e.offering_id, c.course_code, c.title AS course_title,
            t.name AS term_name, o.section, e.exam_type, e.start_date, e.end_date,
            (SELECT COUNT(DISTINCT cp.copy_id)
               FROM syllabus_units u
               JOIN unit_chapter_map m ON m.unit_id = u.unit_id AND m.status = 'APPROVED'
               JOIN chapters ch ON ch.chapter_id = m.chapter_id
               JOIN editions ed ON ed.edition_id = ch.edition_id
               JOIN copies cp ON cp.edition_id = ed.edition_id
              WHERE u.offering_id = o.offering_id) AS copies,
            (SELECT COUNT(*) FROM policy_overrides po
              WHERE po.exam_id = e.exam_id AND po.reverted_at IS NULL) AS active,
            (SELECT po.applied_policy FROM policy_overrides po
              WHERE po.exam_id = e.exam_id AND po.reverted_at IS NULL LIMIT 1) AS applied_policy
       FROM exam_windows e
       JOIN course_offerings o ON o.offering_id = e.offering_id
       JOIN courses c ON c.course_id = o.course_id
       JOIN academic_terms t ON t.term_id = o.term_id
      WHERE e.end_date >= CURDATE()
      ORDER BY e.start_date, c.course_code, o.section`,
  );

  return rows.map((row) => ({
    examId: Number(row.exam_id),
    offeringId: Number(row.offering_id),
    courseCode: row.course_code,
    courseTitle: row.course_title,
    termName: row.term_name,
    section: row.section,
    examType: row.exam_type,
    startsOn: String(row.start_date),
    endsOn: String(row.end_date),
    copies: Number(row.copies),
    active: Number(row.active),
    appliedPolicy: row.applied_policy ?? null,
  }));
}

/**
 * Shortens the loan of every lendable copy on the offering's reading list
 * until the exam window closes. Reference copies stay in the building and
 * copies already out on loan keep their current rule, so they are skipped.
 */
export async function applyExamPolicy(
  examId: number,
  policy: ExamPolicy,
  actorId: number,
): Promise<ApplyResult> {
  return withTransaction(pool("librarian"), async (conn) => {
    await conn.query("SET @app_user_id = ?", [actorId]);

    const [exams] = await conn.query<RowDataPacket[]>(
      `SELECT e.exam_id, e.offering_id, e.end_date, o.status,
              (e.end_date < CURDATE()) AS ended
         FROM exam_windows e
         JOIN course_offerings o ON o.offering_id = e.offering_id
        WHERE e.exam_id = ?
        FOR UPDATE`,
      [examId],
    );
    const exam = exams[0];
    if (!exam) throw new AppError("NOT_FOUND", "That exam window does not exist.");
    if (exam.status === "COMPLETED") {
      throw new AppError("BAD_REQUEST", "That offering has already finished.");
    }
    if (Number(exam.ended) === 1) {
      throw new AppError("BAD_REQUEST", "That exam window has already closed.");
    }

    const [copies] = await conn.query<RowDataPacket[]>(`${READING_LIST_COPIES} FOR UPDATE`, [
      exam.offering_id,
    ]);
    if (copies.length === 0) {
      throw new AppError(
        "BAD_REQUEST",
        "That offering has no approved reading list, so there is nothing to protect.",
      );
    }

    const [active] = await conn.query<RowDataPacket[]>(
      `SELECT copy_id FROM policy_overrides
        WHERE reverted_at IS NULL AND copy_id IN (?)`,
      [copies.map((copy) => Number(copy.copy_id))],
    );
    const busy = new Set(active.map((row) => Number(row.copy_id)));

    let applied = 0;
    let skipped = 0;
    for (const copy of copies) {
      const copyId = Number(copy.copy_id);
      const current = String(copy.loan_policy);
      const onLoan = copy.status === "ON_LOAN";
      if (
        busy.has(copyId) ||
        current === policy ||
        current === "REFERENCE_ONLY" ||
        (policy === "REFERENCE_ONLY" && onLoan)
      ) {
        skipped += 1;
        continue;
      }

      await conn.query(
        `INSERT INTO policy_overrides
           (book_id, copy_id, exam_id, previous_policy, applied_policy, starts_on, ends_on, applied_by)
         SELECT ed.book_id, c.copy_id, ?, ?, ?, CURDATE(), ?, ?
           FROM copies c
           JOIN editions ed ON ed.edition_id = c.edition_id
          WHERE c.copy_id = ?`,
        [examId, current, policy, exam.end_date, actorId, copyId],
      );
      await conn.query("UPDATE copies SET loan_policy = ? WHERE copy_id = ?", [policy, copyId]);
      applied += 1;
    }

    if (applied === 0) {
      throw new AppError(
        "BAD_REQUEST",
        "No lendable copy on that reading list can change policy right now.",
      );
    }
    return { applied, skipped, policy };
  });
}

/** Puts every copy this exam window changed back to its earlier rule. */
export async function revertExamPolicy(examId: number, actorId: number): Promise<number> {
  return withTransaction(pool("librarian"), async (conn) => {
    await conn.query("SET @app_user_id = ?", [actorId]);
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT override_id, copy_id, previous_policy
         FROM policy_overrides
        WHERE exam_id = ? AND reverted_at IS NULL
        FOR UPDATE`,
      [examId],
    );
    if (rows.length === 0) {
      throw new AppError("NOT_FOUND", "No exam policy is active for that window.");
    }

    for (const row of rows) {
      await conn.query("UPDATE copies SET loan_policy = ? WHERE copy_id = ?", [
        row.previous_policy,
        row.copy_id,
      ]);
    }
    await conn.query("UPDATE policy_overrides SET reverted_at = NOW(3) WHERE exam_id = ?", [
      examId,
    ]);
    return rows.length;
  });
}
