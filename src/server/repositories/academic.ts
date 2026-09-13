import "server-only";
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { CourseInput, OfferingInput, TermInput } from "@/lib/validation/academic";

type Db = Pool | PoolConnection;

type TermRow = RowDataPacket & {
  term_id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  is_current: number;
};

type CourseRow = RowDataPacket & {
  course_id: number;
  course_code: string;
  title: string;
  dept_id: number;
  dept_code: string;
  dept_name: string;
  semester: number;
  credits: number;
};

type OfferingRow = RowDataPacket & {
  offering_id: number;
  course_code: string;
  course_title: string;
  term_name: string;
  section: string;
  status: string;
  coordinator: string | null;
  students: number;
};

export type AcademicTerm = {
  termId: number;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
};

export type CourseRecord = {
  courseId: number;
  code: string;
  title: string;
  deptId: number;
  deptCode: string;
  deptName: string;
  semester: number;
  credits: number;
};

export type OfferingRecord = {
  offeringId: number;
  courseCode: string;
  courseTitle: string;
  termName: string;
  section: string;
  status: string;
  coordinator: string | null;
  students: number;
};

export type DepartmentOption = { deptId: number; code: string; name: string };
export type FacultyOption = { userId: number; fullName: string; deptCode: string | null };

export async function academicStructure(db: Db) {
  const [terms] = await db.query<TermRow[]>(
    "SELECT term_id, name, start_date, end_date, is_current FROM academic_terms ORDER BY start_date DESC",
  );
  const [courses] = await db.query<CourseRow[]>(
    `SELECT c.course_id, c.course_code, c.title, c.dept_id, d.dept_code, d.dept_name,
            c.semester, c.credits
       FROM courses c
       JOIN departments d ON d.dept_id = c.dept_id
      ORDER BY c.course_code`,
  );
  const [offerings] = await db.query<OfferingRow[]>(
    `SELECT o.offering_id, c.course_code, c.title AS course_title, t.name AS term_name,
            o.section, o.status, u.full_name AS coordinator,
            (SELECT COUNT(*) FROM enrollments e
              WHERE e.offering_id = o.offering_id AND e.status = 'ENROLLED') AS students
       FROM course_offerings o
       JOIN courses c ON c.course_id = o.course_id
       JOIN academic_terms t ON t.term_id = o.term_id
       LEFT JOIN users u ON u.user_id = o.coordinator_id
      ORDER BY t.start_date DESC, c.course_code, o.section`,
  );
  const [departments] = await db.query<RowDataPacket[]>(
    "SELECT dept_id, dept_code, dept_name FROM departments ORDER BY dept_code",
  );
  const [faculty] = await db.query<RowDataPacket[]>(
    `SELECT u.user_id, u.full_name, d.dept_code
       FROM users u
       JOIN roles r ON r.role_id = u.role_id
       LEFT JOIN departments d ON d.dept_id = u.dept_id
      WHERE r.role_name = 'FACULTY' AND u.status = 'ACTIVE'
      ORDER BY u.full_name`,
  );

  return {
    terms: terms.map(
      (row) =>
        ({
          termId: Number(row.term_id),
          name: row.name,
          startDate: row.start_date,
          endDate: row.end_date,
          isCurrent: Boolean(row.is_current),
        }) satisfies AcademicTerm,
    ),
    courses: courses.map(
      (row) =>
        ({
          courseId: Number(row.course_id),
          code: row.course_code,
          title: row.title,
          deptId: Number(row.dept_id),
          deptCode: row.dept_code,
          deptName: row.dept_name,
          semester: Number(row.semester),
          credits: Number(row.credits),
        }) satisfies CourseRecord,
    ),
    offerings: offerings.map(
      (row) =>
        ({
          offeringId: Number(row.offering_id),
          courseCode: row.course_code,
          courseTitle: row.course_title,
          termName: row.term_name,
          section: row.section,
          status: row.status,
          coordinator: row.coordinator,
          students: Number(row.students),
        }) satisfies OfferingRecord,
    ),
    departments: departments.map(
      (row) =>
        ({
          deptId: Number(row.dept_id),
          code: row.dept_code,
          name: row.dept_name,
        }) satisfies DepartmentOption,
    ),
    faculty: faculty.map(
      (row) =>
        ({
          userId: Number(row.user_id),
          fullName: row.full_name,
          deptCode: row.dept_code,
        }) satisfies FacultyOption,
    ),
  };
}

export async function insertTerm(db: Db, input: TermInput) {
  await db.query<ResultSetHeader>(
    "INSERT INTO academic_terms (name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)",
    [input.name, input.startDate, input.endDate, input.current],
  );
}

export async function clearCurrentTerm(db: Db) {
  await db.query("UPDATE academic_terms SET is_current = FALSE WHERE is_current = TRUE");
}

export async function markCurrentTerm(db: Db, termId: number) {
  await db.query("UPDATE academic_terms SET is_current = TRUE WHERE term_id = ?", [termId]);
}

export async function insertCourse(db: Db, input: CourseInput) {
  await db.query<ResultSetHeader>(
    "INSERT INTO courses (course_code, title, dept_id, semester, credits, description) VALUES (?, ?, ?, ?, ?, ?)",
    [input.courseCode, input.title, input.deptId, input.semester, input.credits, input.description],
  );
}

export async function insertOffering(db: Db, input: OfferingInput) {
  await db.query<ResultSetHeader>(
    "INSERT INTO course_offerings (course_id, term_id, section, coordinator_id, status) VALUES (?, ?, ?, ?, ?)",
    [input.courseId, input.termId, input.section, input.coordinatorId, input.status],
  );
}
