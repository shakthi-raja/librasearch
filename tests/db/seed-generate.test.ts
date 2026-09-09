import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedCatalogue } from "../../db/seed/catalogue";
import { generate } from "../../db/seed/generate";
import { adminConnection } from "../support/db";
import { FAKE_ARGON2ID } from "../support/fixtures";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
  await db.query(
    "INSERT IGNORE INTO departments (dept_code, dept_name) VALUES ('CSE','Computer Science and Engineering'),('ECE','Electronics and Communication Engineering'),('EEE','Electrical and Electronics Engineering'),('ME','Mechanical Engineering'),('MATH','Mathematics'),('MGMT','Management Studies')",
  );
  await db.query(
    `INSERT IGNORE INTO users (role_id, dept_id, university_id, full_name, email, password_hash)
     SELECT r.role_id, d.dept_id, 'FAC0001', 'Arvind Rao', 'faculty@librasearch.local', ?
       FROM roles r JOIN departments d ON d.dept_code = 'CSE' WHERE r.role_name = 'FACULTY'`,
    [FAKE_ARGON2ID],
  );
  await seedCatalogue(db);
});

afterAll(async () => {
  await db.end();
});

const snapshot = async () => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT (SELECT GROUP_CONCAT(university_id ORDER BY university_id) FROM users WHERE university_id LIKE 'PES1UG%') AS students,
            (SELECT GROUP_CONCAT(barcode ORDER BY barcode) FROM copies WHERE barcode LIKE 'LS26%') AS barcodes,
            (SELECT COUNT(*) FROM enrollments) AS enrollments`,
  );
  return rows[0];
};

describe("deterministic generator", () => {
  it("produces the same rows on every run", async () => {
    const today = new Date("2026-09-11T00:00:00Z");
    const first = await generate(db, FAKE_ARGON2ID, today);
    const before = await snapshot();
    const second = await generate(db, FAKE_ARGON2ID, today);
    expect(second).toEqual(first);
    expect(await snapshot()).toEqual(before);
  });

  it("uses real roll number and barcode formats", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT university_id FROM users WHERE university_id LIKE 'PES1UG%' ORDER BY university_id LIMIT 1",
    );
    expect(String(rows[0]?.university_id)).toMatch(/^PES1UG2[45](CS|EC|EE|ME)\d{3}$/);
  });

  it("leaves the database course short of copies, as exam season is", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT e.student_id) AS students, ea.available_copies AS copies
         FROM courses c
         JOIN course_offerings o ON o.course_id = c.course_id
         JOIN enrollments e ON e.offering_id = o.offering_id
         JOIN editions ed ON ed.isbn13 = '9780078022159'
         JOIN v_edition_availability ea ON ea.edition_id = ed.edition_id
        WHERE c.course_code = 'UE24CS351A'
        GROUP BY ea.available_copies`,
    );
    const students = Number(rows[0]?.students);
    const copies = Number(rows[0]?.copies);
    expect(students / copies).toBeGreaterThan(20);
  });

  it("schedules an end-semester exam ahead of the seed date", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT DATEDIFF(x.start_date, '2026-09-11') AS days FROM exam_windows x
         JOIN course_offerings o ON o.offering_id = x.offering_id
         JOIN courses c ON c.course_id = o.course_id
        WHERE c.course_code = 'UE24CS351A' AND x.exam_type = 'END_SEM'`,
    );
    expect(rows[0]?.days).toBe(7);
  });
});
