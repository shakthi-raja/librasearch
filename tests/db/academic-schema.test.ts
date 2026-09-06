import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminConnection } from "../support/db";
import { insertDepartment, insertUser } from "../support/fixtures";
import { ER, expectSqlError } from "../support/sql-errors";

let db: Connection;
let deptId: number;
let courseId: number;
let termId: number;
let seq = 0;

beforeAll(async () => {
  db = await adminConnection();
  deptId = await insertDepartment(db);
  const [course] = await db.query<ResultSetHeader>(
    "INSERT INTO courses (course_code, title, dept_id, semester, credits) VALUES ('UE24CS351A', 'Database Management Systems', ?, 5, 4)",
    [deptId],
  );
  courseId = course.insertId;
  const [term] = await db.query<ResultSetHeader>(
    "INSERT INTO academic_terms (name, start_date, end_date) VALUES ('Test term', '2026-08-01', '2026-12-15')",
  );
  termId = term.insertId;
});

afterAll(async () => {
  await db.end();
});

const offering = async (coordinatorId: number | null) => {
  const section = String.fromCharCode(65 + (seq++ % 26));
  const [r] = await db.query<ResultSetHeader>(
    "INSERT INTO course_offerings (course_id, term_id, section, coordinator_id) VALUES (?, ?, ?, ?)",
    [courseId, termId, section, coordinatorId],
  );
  return r.insertId;
};

describe("academic terms", () => {
  it("allow exactly one current term", async () => {
    await db.query("UPDATE academic_terms SET is_current = TRUE WHERE term_id = ?", [termId]);
    await expectSqlError(
      db.query(
        "INSERT INTO academic_terms (name, start_date, end_date, is_current) VALUES ('Second current', '2027-01-01', '2027-05-01', TRUE)",
      ),
      ER.DUP_ENTRY,
      /uq_academic_terms_current/,
    );
    await db.query(
      "INSERT INTO academic_terms (name, start_date, end_date) VALUES ('Next term', '2027-01-01', '2027-05-01')",
    );
  });

  it("must end after they start", async () => {
    await expectSqlError(
      db.query(
        "INSERT INTO academic_terms (name, start_date, end_date) VALUES ('Backwards', '2027-06-01', '2027-05-01')",
      ),
      ER.CHECK_CONSTRAINT_VIOLATED,
    );
  });
});

describe("course offerings", () => {
  it("accept faculty of the owning department as coordinator", async () => {
    const faculty = await insertUser(db, "FACULTY", { deptId });
    await expect(offering(faculty)).resolves.toBeGreaterThan(0);
  });

  it.each([
    ["a student", "STUDENT" as const, true],
    ["faculty of another department", "FACULTY" as const, false],
  ])("reject %s as coordinator", async (_label, role, sameDept) => {
    const other = sameDept ? deptId : await insertDepartment(db);
    const user = await insertUser(db, role, { deptId: other });
    await expectSqlError(offering(user), ER.SIGNAL_EXCEPTION, /LS101/);
  });

  it("check the coordinator again when it changes", async () => {
    const id = await offering(null);
    const student = await insertUser(db, "STUDENT", { deptId });
    await expectSqlError(
      db.query("UPDATE course_offerings SET coordinator_id = ? WHERE offering_id = ?", [
        student,
        id,
      ]),
      ER.SIGNAL_EXCEPTION,
      /LS101/,
    );
  });
});

describe("enrollments", () => {
  it("admit active students only", async () => {
    const id = await offering(null);
    const student = await insertUser(db, "STUDENT", { deptId });
    await db.query("INSERT INTO enrollments (student_id, offering_id) VALUES (?, ?)", [
      student,
      id,
    ]);

    const faculty = await insertUser(db, "FACULTY", { deptId });
    await expectSqlError(
      db.query("INSERT INTO enrollments (student_id, offering_id) VALUES (?, ?)", [faculty, id]),
      ER.SIGNAL_EXCEPTION,
      /LS102/,
    );

    const suspended = await insertUser(db, "STUDENT", { deptId });
    await db.query("UPDATE users SET status = 'SUSPENDED' WHERE user_id = ?", [suspended]);
    await expectSqlError(
      db.query("INSERT INTO enrollments (student_id, offering_id) VALUES (?, ?)", [suspended, id]),
      ER.SIGNAL_EXCEPTION,
      /LS102/,
    );
  });
});

describe("syllabus and exams", () => {
  it("number units 1 to 12, once each per offering", async () => {
    const id = await offering(null);
    await db.query(
      "INSERT INTO syllabus_units (offering_id, unit_no, title, topics, hours) VALUES (?, 1, 'Relational model', 'Keys, algebra', 10)",
      [id],
    );
    await expectSqlError(
      db.query(
        "INSERT INTO syllabus_units (offering_id, unit_no, title, topics, hours) VALUES (?, 1, 'Again', 'Again', 4)",
        [id],
      ),
      ER.DUP_ENTRY,
    );
    await expectSqlError(
      db.query(
        "INSERT INTO syllabus_units (offering_id, unit_no, title, topics, hours) VALUES (?, 13, 'Too many', 'More', 4)",
        [id],
      ),
      ER.CHECK_CONSTRAINT_VIOLATED,
    );
  });

  it("removes units and exams with their offering", async () => {
    const id = await offering(null);
    await db.query(
      "INSERT INTO exam_windows (offering_id, exam_type, start_date, end_date) VALUES (?, 'END_SEM', '2026-11-20', '2026-11-30')",
      [id],
    );
    await db.query("DELETE FROM course_offerings WHERE offering_id = ?", [id]);
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM exam_windows WHERE offering_id = ?",
      [id],
    );
    expect(rows[0]?.n).toBe(0);
  });
});

describe("library settings", () => {
  it("is a single row", async () => {
    await expectSqlError(
      db.query("INSERT INTO library_settings (setting_id) VALUES (2)"),
      ER.CHECK_CONSTRAINT_VIOLATED,
    );
    await expectSqlError(
      db.query("INSERT INTO library_settings (setting_id) VALUES (1)"),
      ER.DUP_ENTRY,
    );
  });

  it("keeps the short loan no longer than the busy loan", async () => {
    await expectSqlError(
      db.query("UPDATE library_settings SET short_loan_days = 10 WHERE setting_id = 1"),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_library_settings_loan_days/,
    );
  });
});
