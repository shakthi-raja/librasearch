import type { Connection, ResultSetHeader } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminConnection } from "../support/db";
import { insertDepartment, insertUser, nextId } from "../support/fixtures";
import { ER, expectSqlError } from "../support/sql-errors";

let db: Connection;
let deptA: number;
let deptB: number;
let facultyA: number;
let facultyB: number;
let student: number;
let termId: number;

beforeAll(async () => {
  db = await adminConnection();
  deptA = await insertDepartment(db);
  deptB = await insertDepartment(db);
  facultyA = await insertUser(db, "FACULTY", { deptId: deptA });
  facultyB = await insertUser(db, "FACULTY", { deptId: deptB });
  student = await insertUser(db, "STUDENT");
  const [term] = await db.query<ResultSetHeader>(
    "INSERT INTO academic_terms (name, start_date, end_date) VALUES (?, '2026-01-05', '2026-05-29')",
    [`Term ${await nextId(db, "academic_terms", "term_id")}`],
  );
  termId = term.insertId;
});

afterAll(async () => {
  await db.end();
});

const insertCourse = async (deptId: number) => {
  const n = await nextId(db, "courses", "course_id");
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO courses (course_code, title, dept_id, semester, credits) VALUES (?, ?, ?, 4, 4)",
    [`TST${String(n).padStart(5, "0")}`, `Course ${n}`, deptId],
  );
  return result.insertId;
};

const insertOffering = (courseId: number, section: string, coordinator: number | null) =>
  db.query<ResultSetHeader>(
    "INSERT INTO course_offerings (course_id, term_id, section, coordinator_id) VALUES (?, ?, ?, ?)",
    [courseId, termId, section, coordinator],
  );

describe("course offering coordinator", () => {
  it("accepts active faculty from the course department", async () => {
    const courseId = await insertCourse(deptA);
    await expect(insertOffering(courseId, "A", facultyA)).resolves.toBeDefined();
  });

  it("refuses a coordinator from another department", async () => {
    const courseId = await insertCourse(deptA);
    await expectSqlError(insertOffering(courseId, "B", facultyB), ER.SIGNAL_EXCEPTION, /LS101/);
  });

  it("refuses a student coordinator", async () => {
    const courseId = await insertCourse(deptA);
    await expectSqlError(insertOffering(courseId, "C", student), ER.SIGNAL_EXCEPTION, /LS101/);
  });

  it("refuses a suspended faculty coordinator", async () => {
    const courseId = await insertCourse(deptA);
    await db.query("UPDATE users SET status = 'SUSPENDED' WHERE user_id = ?", [facultyA]);
    try {
      await expectSqlError(insertOffering(courseId, "D", facultyA), ER.SIGNAL_EXCEPTION, /LS101/);
    } finally {
      await db.query("UPDATE users SET status = 'ACTIVE' WHERE user_id = ?", [facultyA]);
    }
  });

  it("rechecks the coordinator and the course on update", async () => {
    const courseId = await insertCourse(deptA);
    const [offering] = await insertOffering(courseId, "E", facultyA);
    await expectSqlError(
      db.query("UPDATE course_offerings SET coordinator_id = ? WHERE offering_id = ?", [
        facultyB,
        offering.insertId,
      ]),
      ER.SIGNAL_EXCEPTION,
      /LS101/,
    );
    const otherCourse = await insertCourse(deptB);
    await expectSqlError(
      db.query("UPDATE course_offerings SET course_id = ? WHERE offering_id = ?", [
        otherCourse,
        offering.insertId,
      ]),
      ER.SIGNAL_EXCEPTION,
      /LS101/,
    );
  });
});

describe("enrollments", () => {
  it("enrolls an active student", async () => {
    const courseId = await insertCourse(deptA);
    const [offering] = await insertOffering(courseId, "F", facultyA);
    await expect(
      db.query("INSERT INTO enrollments (student_id, offering_id) VALUES (?, ?)", [
        student,
        offering.insertId,
      ]),
    ).resolves.toBeDefined();
  });

  it("refuses a faculty member", async () => {
    const courseId = await insertCourse(deptA);
    const [offering] = await insertOffering(courseId, "G", facultyA);
    await expectSqlError(
      db.query("INSERT INTO enrollments (student_id, offering_id) VALUES (?, ?)", [
        facultyA,
        offering.insertId,
      ]),
      ER.SIGNAL_EXCEPTION,
      /LS102/,
    );
  });

  it("refuses a suspended student", async () => {
    const suspended = await insertUser(db, "STUDENT");
    await db.query("UPDATE users SET status = 'SUSPENDED' WHERE user_id = ?", [suspended]);
    const courseId = await insertCourse(deptA);
    const [offering] = await insertOffering(courseId, "H", facultyA);
    await expectSqlError(
      db.query("INSERT INTO enrollments (student_id, offering_id) VALUES (?, ?)", [
        suspended,
        offering.insertId,
      ]),
      ER.SIGNAL_EXCEPTION,
      /LS102/,
    );
  });

  it("refuses moving an enrollment to a different student", async () => {
    const other = await insertUser(db, "STUDENT");
    const courseId = await insertCourse(deptA);
    const [offering] = await insertOffering(courseId, "I", facultyA);
    await db.query("INSERT INTO enrollments (student_id, offering_id) VALUES (?, ?)", [
      student,
      offering.insertId,
    ]);
    await expectSqlError(
      db.query("UPDATE enrollments SET student_id = ? WHERE offering_id = ? AND student_id = ?", [
        other,
        offering.insertId,
        student,
      ]),
      ER.SIGNAL_EXCEPTION,
      /LS103/,
    );
  });

  it("lets the enrollment status change", async () => {
    const courseId = await insertCourse(deptA);
    const [offering] = await insertOffering(courseId, "J", facultyA);
    await db.query("INSERT INTO enrollments (student_id, offering_id) VALUES (?, ?)", [
      student,
      offering.insertId,
    ]);
    await expect(
      db.query(
        "UPDATE enrollments SET status = 'DROPPED' WHERE offering_id = ? AND student_id = ?",
        [offering.insertId, student],
      ),
    ).resolves.toBeDefined();
  });
});
