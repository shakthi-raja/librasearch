import type { Connection, ResultSetHeader } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readerContext } from "@/server/search/reader";
import { insertBook, insertCategory, insertEdition } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertDepartment, insertUser, nextId } from "../support/fixtures";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

/** A running offering with one unit, one approved chapter and one prescribed book. */
async function course(
  status: "RUNNING" | "COMPLETED",
  coordinator: { userId: number; deptId: number } | null = null,
) {
  const n = await nextId(db, "courses", "course_id");
  const code = `RC${String(n).padStart(8, "0")}`;
  const [c] = await db.query<ResultSetHeader>(
    "INSERT INTO courses (course_code, title, dept_id, semester, credits) VALUES (?, 'Reader course', ?, 5, 4)",
    [code, coordinator?.deptId ?? (await insertDepartment(db))],
  );
  const [t] = await db.query<ResultSetHeader>(
    `INSERT INTO academic_terms (name, start_date, end_date)
     VALUES (?, CURDATE() - INTERVAL 30 DAY, CURDATE() + INTERVAL 60 DAY)`,
    [`Reader term ${n}`],
  );
  const [o] = await db.query<ResultSetHeader>(
    "INSERT INTO course_offerings (course_id, term_id, section, status, coordinator_id) VALUES (?, ?, 'A', ?, ?)",
    [c.insertId, t.insertId, status, coordinator?.userId ?? null],
  );
  const [u] = await db.query<ResultSetHeader>(
    `INSERT INTO syllabus_units (offering_id, unit_no, title, topics, hours)
     VALUES (?, 2, 'Normal forms', 'Functional dependencies and normal forms', 10)`,
    [o.insertId],
  );
  const category = await insertCategory(db);
  const mappedBook = await insertBook(db, category);
  const edition = await insertEdition(db, mappedBook);
  const [ch] = await db.query<ResultSetHeader>(
    `INSERT INTO chapters (edition_id, chapter_no, title, page_start, page_end, summary)
     VALUES (?, 1, 'Normalisation', 1, 20, 'Functional dependencies, closures and the normal forms up to BCNF.')`,
    [edition],
  );
  await db.query(
    `INSERT INTO unit_chapter_map (unit_id, chapter_id, source, status, reviewed_at)
     VALUES (?, ?, 'MANUAL', 'APPROVED', NOW(3))`,
    [u.insertId, ch.insertId],
  );
  const prescribed = await insertBook(db, category);
  await db.query(
    "INSERT INTO course_books (course_id, book_id, role, position) VALUES (?, ?, 'TEXTBOOK', 1)",
    [c.insertId, prescribed],
  );
  return { code, offeringId: o.insertId, chapterId: ch.insertId, prescribed };
}

describe("readerContext", () => {
  it("gives a student the approved chapters and prescribed books of their courses", async () => {
    const student = await insertUser(db, "STUDENT");
    const running = await course("RUNNING");
    await db.query("INSERT INTO enrollments (student_id, offering_id) VALUES (?, ?)", [
      student,
      running.offeringId,
    ]);

    const context = await readerContext({ userId: student, role: "STUDENT" });
    expect(context.chapters.get(running.chapterId)).toEqual({
      courseCode: running.code,
      unitNo: 2,
      unitTitle: "Normal forms",
    });
    expect(context.books.get(running.prescribed)).toEqual([running.code]);
  });

  it("ignores courses that are not running or that the student dropped", async () => {
    const student = await insertUser(db, "STUDENT");
    const finished = await course("COMPLETED");
    const dropped = await course("RUNNING");
    await db.query("INSERT INTO enrollments (student_id, offering_id) VALUES (?, ?)", [
      student,
      finished.offeringId,
    ]);
    await db.query(
      "INSERT INTO enrollments (student_id, offering_id, status) VALUES (?, ?, 'DROPPED')",
      [student, dropped.offeringId],
    );

    const context = await readerContext({ userId: student, role: "STUDENT" });
    expect(context.chapters.size).toBe(0);
    expect(context.books.size).toBe(0);
  });

  it("uses the courses a teacher coordinates", async () => {
    const deptId = await insertDepartment(db);
    const teacher = await insertUser(db, "FACULTY", { deptId });
    const taught = await course("RUNNING", { userId: teacher, deptId });
    const context = await readerContext({ userId: teacher, role: "FACULTY" });
    expect(context.chapters.has(taught.chapterId)).toBe(true);
  });

  it("is empty for librarians and guests", async () => {
    const librarian = await insertUser(db, "LIBRARIAN");
    expect((await readerContext({ userId: librarian, role: "LIBRARIAN" })).chapters.size).toBe(0);
    expect((await readerContext(null)).books.size).toBe(0);
  });
});
