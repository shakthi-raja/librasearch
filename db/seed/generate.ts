import { fakerEN_IN as faker } from "@faker-js/faker";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { COURSES } from "./academic-data";
import { BOOKS } from "./catalogue-data";

/**
 * Deterministic people, courses, offerings and copies. The same seed always
 * produces the same rows, and every write is an upsert on a natural key, so
 * the generator can run on every `pnpm db:seed`.
 */

export const SEED = 20_260_901;

const CURRENT_TERM = { name: "Aug-Dec 2026", start: "2026-08-03", end: "2026-12-18" };
const PREVIOUS_TERM = { name: "Jan-May 2026", start: "2026-01-05", end: "2026-05-29" };

// Bengaluru campus closures used by due-date maths
const HOLIDAYS: [string, string][] = [
  ["2026-01-26", "Republic Day"],
  ["2026-08-15", "Independence Day"],
  ["2026-10-02", "Gandhi Jayanti"],
  ["2026-11-01", "Kannada Rajyotsava"],
  ["2026-12-25", "Christmas"],
];

// students per department and admission batch
const COHORTS: { dept: string; batch: number; count: number }[] = [
  { dept: "CSE", batch: 2024, count: 92 },
  { dept: "CSE", batch: 2025, count: 18 },
  { dept: "ECE", batch: 2024, count: 14 },
  { dept: "ECE", batch: 2025, count: 10 },
  { dept: "EEE", batch: 2025, count: 8 },
  { dept: "ME", batch: 2025, count: 8 },
];

const PROGRAM: Record<string, string> = {
  CSE: "B.Tech CSE",
  ECE: "B.Tech ECE",
  EEE: "B.Tech EEE",
  ME: "B.Tech ME",
};

// branch code inside a university id, as in PES1UG24CS001
const BRANCH: Record<string, string> = { CSE: "CS", ECE: "EC", EEE: "EE", ME: "ME" };

const pad = (n: number, width: number) => String(n).padStart(width, "0");

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function id(db: Connection, sql: string, params: unknown[]): Promise<number> {
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  const value = rows[0]?.id;
  if (typeof value !== "number") throw new Error(`lookup failed: ${sql}`);
  return value;
}

const emailFor = (first: string, last: string, n: number) =>
  `${first}.${last}.${n}`
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .toLowerCase()
    .concat("@librasearch.local");

async function upsertUser(
  db: Connection,
  user: {
    role: "STUDENT" | "FACULTY" | "LIBRARIAN";
    universityId: string;
    fullName: string;
    email: string;
    dept: string | null;
    passwordHash: string;
    program?: string;
    batchYear?: number;
    designation?: string;
    phone?: string;
  },
) {
  await db.query(
    `INSERT INTO users
       (role_id, dept_id, university_id, full_name, email, phone, password_hash, program, batch_year, designation)
     SELECT r.role_id, d.dept_id, ?, ?, ?, ?, ?, ?, ?, ?
       FROM roles r
       LEFT JOIN departments d ON d.dept_code = ?
      WHERE r.role_name = ?
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
    [
      user.universityId,
      user.fullName,
      user.email,
      user.phone ?? null,
      user.passwordHash,
      user.program ?? null,
      user.batchYear ?? null,
      user.designation ?? null,
      user.dept,
      user.role,
    ],
  );
}

export type GeneratedCounts = {
  students: number;
  faculty: number;
  librarians: number;
  courses: number;
  units: number;
  enrollments: number;
  copies: number;
};

export async function generate(
  db: Connection,
  passwordHash: string,
  today = new Date(),
): Promise<GeneratedCounts> {
  faker.seed(SEED);

  // terms and closures
  await db.query("UPDATE academic_terms SET is_current = FALSE WHERE name <> ?", [
    CURRENT_TERM.name,
  ]);
  for (const [term, current] of [
    [PREVIOUS_TERM, false],
    [CURRENT_TERM, true],
  ] as const) {
    await db.query(
      `INSERT INTO academic_terms (name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE start_date = VALUES(start_date), end_date = VALUES(end_date), is_current = VALUES(is_current)`,
      [term.name, term.start, term.end, current],
    );
  }
  const termId = await id(db, "SELECT term_id AS id FROM academic_terms WHERE name = ?", [
    CURRENT_TERM.name,
  ]);
  for (const [date, name] of HOLIDAYS) {
    await db.query(
      "INSERT INTO holidays (holiday_date, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)",
      [date, name],
    );
  }

  // librarians beyond the demo account
  for (let n = 2; n <= 3; n++) {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    await upsertUser(db, {
      role: "LIBRARIAN",
      universityId: `LIB${pad(n, 4)}`,
      fullName: `${first} ${last}`,
      email: emailFor(first, last, n),
      dept: null,
      passwordHash,
      designation: "Library Assistant",
    });
  }

  // one coordinator per course; the demo faculty account (FAC0001) teaches DBMS
  let facultyNo = 1;
  let units = 0;
  for (const course of COURSES) {
    await db.query(
      `INSERT INTO courses (course_code, title, dept_id, semester, credits, description)
       SELECT ?, ?, dept_id, ?, ?, ? FROM departments WHERE dept_code = ?
       ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description)`,
      [course.code, course.title, course.semester, course.credits, course.description, course.dept],
    );

    const coordinatorId = course.code === "UE24CS351A" ? "FAC0001" : `FAC${pad(++facultyNo, 4)}`;
    if (coordinatorId !== "FAC0001") {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      await upsertUser(db, {
        role: "FACULTY",
        universityId: coordinatorId,
        fullName: `${first} ${last}`,
        email: emailFor(first, last, facultyNo),
        dept: course.dept,
        passwordHash,
        designation: faker.helpers.arrayElement([
          "Assistant Professor",
          "Associate Professor",
          "Professor",
        ]),
      });
    }

    await db.query(
      `INSERT INTO course_offerings (course_id, term_id, section, coordinator_id, status)
       SELECT c.course_id, ?, 'A', u.user_id, 'RUNNING'
         FROM courses c JOIN users u ON u.university_id = ?
        WHERE c.course_code = ?
       ON DUPLICATE KEY UPDATE coordinator_id = VALUES(coordinator_id), status = VALUES(status)`,
      [termId, coordinatorId, course.code],
    );
    const offeringId = await id(
      db,
      `SELECT o.offering_id AS id FROM course_offerings o JOIN courses c ON c.course_id = o.course_id
        WHERE c.course_code = ? AND o.term_id = ? AND o.section = 'A'`,
      [course.code, termId],
    );

    for (const [index, unit] of course.units.entries()) {
      await db.query(
        `INSERT INTO syllabus_units (offering_id, unit_no, title, topics, hours) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), topics = VALUES(topics), hours = VALUES(hours)`,
        [offeringId, index + 1, unit.title, unit.topics, unit.hours],
      );
      units++;
    }

    // a mid-semester exam already past and an end-semester exam ahead
    const endStart = addDays(today, course.endSemInDays);
    const windows: [string, Date, Date][] = [
      ["MID_SEM", addDays(today, -45), addDays(today, -40)],
      ["END_SEM", endStart, addDays(endStart, 5)],
    ];
    for (const [type, start, end] of windows) {
      await db.query(
        `INSERT INTO exam_windows (offering_id, exam_type, start_date, end_date) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE start_date = VALUES(start_date), end_date = VALUES(end_date)`,
        [offeringId, type, isoDate(start), isoDate(end)],
      );
    }
  }

  // students, numbered within department and batch like real roll numbers
  let students = 0;
  for (const cohort of COHORTS) {
    for (let n = 1; n <= cohort.count; n++) {
      const universityId = `PES1UG${String(cohort.batch).slice(2)}${BRANCH[cohort.dept]}${pad(n, 3)}`;
      // the demo student account already holds the first CSE roll number
      if (universityId === "PES1UG24CS001") continue;
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      await upsertUser(db, {
        role: "STUDENT",
        universityId,
        fullName: `${first} ${last}`,
        email: emailFor(first, last, n + cohort.batch),
        dept: cohort.dept,
        passwordHash,
        program: PROGRAM[cohort.dept] ?? "B.Tech",
        batchYear: cohort.batch,
        phone: `+919${faker.string.numeric(9)}`,
      });
      students++;
    }
  }

  // enrol each active student in the running offerings of their department and semester,
  // plus mathematics courses for computing students
  const [enrolled] = await db.query<RowDataPacket[]>(
    `INSERT IGNORE INTO enrollments (student_id, offering_id)
     SELECT u.user_id, o.offering_id
       FROM users u
       JOIN roles r ON r.role_id = u.role_id AND r.role_name = 'STUDENT'
       JOIN departments ud ON ud.dept_id = u.dept_id
       JOIN course_offerings o ON o.term_id = ? AND o.status = 'RUNNING'
       JOIN courses c ON c.course_id = o.course_id
       JOIN departments cd ON cd.dept_id = c.dept_id
      WHERE u.status = 'ACTIVE'
        AND c.semester IN ((2026 - u.batch_year) * 2 + 1, (2026 - u.batch_year) * 2)
        AND (cd.dept_code = ud.dept_code OR (cd.dept_code = 'MATH' AND ud.dept_code IN ('CSE', 'ECE')))`,
    [termId],
  );
  void enrolled;

  // copies: scarce for the titles a whole cohort needs, one reading-room copy for those
  const SCARCE = new Set(["9780078022159", "9780262046305", "9781119320913", "9780133594140"]);
  let accession = 0;
  let copies = 0;
  for (const book of BOOKS) {
    const editions = [...book.editions].sort((a, b) => a.editionNo - b.editionNo);
    for (const [index, edition] of editions.entries()) {
      const latest = index === editions.length - 1;
      const count = SCARCE.has(edition.isbn13)
        ? 4
        : latest
          ? faker.number.int({ min: 2, max: 5 })
          : faker.number.int({ min: 1, max: 2 });
      const editionId = await id(db, "SELECT edition_id AS id FROM editions WHERE isbn13 = ?", [
        edition.isbn13,
      ]);
      for (let c = 0; c < count; c++) {
        accession++;
        const acquiredYear = Math.max(edition.year, faker.number.int({ min: 2015, max: 2026 }));
        const acquired = `${acquiredYear}-${pad(faker.number.int({ min: 1, max: 7 }), 2)}-${pad(faker.number.int({ min: 1, max: 28 }), 2)}`;
        const referenceCopy = latest && SCARCE.has(edition.isbn13) && c === count - 1;
        await db.query(
          `INSERT INTO copies
             (edition_id, accession_no, barcode, rack_code, shelf_code, loan_policy, condition_state,
              acquired_on, acquisition_cost, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE rack_code = VALUES(rack_code), shelf_code = VALUES(shelf_code)`,
          [
            editionId,
            `ACC-${acquiredYear}-${pad(accession, 5)}`,
            `LS${pad(26_000_000 + accession, 8)}`,
            book.rack,
            `S${faker.number.int({ min: 1, max: 6 })}`,
            referenceCopy ? "REFERENCE_ONLY" : "REGULAR",
            acquiredYear >= 2025 ? "NEW" : faker.helpers.arrayElement(["GOOD", "GOOD", "WORN"]),
            acquired,
            faker.number.int({ min: 45, max: 450 }) * 10,
            faker.helpers.weightedArrayElement([
              { weight: 9, value: "PURCHASE" },
              { weight: 1, value: "DONATION" },
            ]),
          ],
        );
        copies++;
      }
    }
  }

  const [[counts]] = (await db.query<RowDataPacket[]>(
    `SELECT (SELECT COUNT(*) FROM users u JOIN roles r ON r.role_id = u.role_id WHERE r.role_name = 'FACULTY') AS faculty,
            (SELECT COUNT(*) FROM users u JOIN roles r ON r.role_id = u.role_id WHERE r.role_name = 'LIBRARIAN') AS librarians,
            (SELECT COUNT(*) FROM enrollments) AS enrollments`,
  )) as unknown as [[RowDataPacket]];

  return {
    students: students + 1,
    faculty: Number(counts?.faculty),
    librarians: Number(counts?.librarians),
    courses: COURSES.length,
    units,
    enrollments: Number(counts?.enrollments),
    copies,
  };
}
