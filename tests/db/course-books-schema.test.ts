import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { insertBook, insertCategory } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertDepartment } from "../support/fixtures";
import { ER, expectSqlError } from "../support/sql-errors";

let db: Connection;
let deptId: number;
let categoryId: number;

beforeAll(async () => {
  db = await adminConnection();
  deptId = await insertDepartment(db);
  categoryId = await insertCategory(db);
});

afterAll(async () => {
  await db.end();
});

let seq = 0;
const course = async (code = `UE24CS342B${String(++seq).padStart(2, "0")}${Date.now() % 1000}`) => {
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO courses (course_code, title, dept_id, semester, credits) VALUES (?, 'Elective', ?, 6, 4)",
    [code.slice(0, 16), deptId],
  );
  return result.insertId;
};

const prescribe = (courseId: number, bookId: number, role: string, position: number) =>
  db.query("INSERT INTO course_books (course_id, book_id, role, position) VALUES (?, ?, ?, ?)", [
    courseId,
    bookId,
    role,
    position,
  ]);

describe("courses", () => {
  it("accepts the thirteen-character elective codes of the 2026 syllabus", async () => {
    const id = await course(`UE24CS342BA${10 + (Date.now() % 80)}`);
    expect(id).toBeGreaterThan(0);
  });

  it("still rejects lowercase or punctuated codes", async () => {
    await expectSqlError(course("ue24cs351a"), ER.CHECK_CONSTRAINT_VIOLATED);
    await expectSqlError(course("UE24-CS351A"), ER.CHECK_CONSTRAINT_VIOLATED);
  });
});

describe("course_books", () => {
  it("lists a book once per course and keeps positions distinct within a role", async () => {
    const courseId = await course();
    const first = await insertBook(db, categoryId);
    const second = await insertBook(db, categoryId);
    await prescribe(courseId, first, "TEXTBOOK", 1);
    await expectSqlError(prescribe(courseId, first, "REFERENCE", 1), ER.DUP_ENTRY);
    await expectSqlError(prescribe(courseId, second, "TEXTBOOK", 1), ER.DUP_ENTRY);
    await prescribe(courseId, second, "REFERENCE", 1);
  });

  it("rejects an unknown role and a position out of range", async () => {
    const courseId = await course();
    const book = await insertBook(db, categoryId);
    await expectSqlError(prescribe(courseId, book, "OPTIONAL", 1), ER.TRUNCATED_WRONG_VALUE);
    await expectSqlError(prescribe(courseId, book, "TEXTBOOK", 0), ER.CHECK_CONSTRAINT_VIOLATED);
  });

  it("shows prescriptions with live availability and drops them with the course", async () => {
    const courseId = await course();
    const book = await insertBook(db, categoryId);
    await prescribe(courseId, book, "TEXTBOOK", 1);

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT role, available_copies FROM v_prescribed_books WHERE course_id = ?",
      [courseId],
    );
    expect(rows).toEqual([{ role: "TEXTBOOK", available_copies: "0" }]);

    await db.query("DELETE FROM courses WHERE course_id = ?", [courseId]);
    const [left] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM course_books WHERE course_id = ?",
      [courseId],
    );
    expect(Number(left[0]?.n)).toBe(0);
  });
});
