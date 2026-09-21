import type { Connection, ResultSetHeader } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { shortagePlanner } from "@/server/services/demand";
import { insertCopy, insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertDepartment, insertUser, nextId } from "../support/fixtures";

let db: Connection;
let faculty: number;

beforeAll(async () => {
  db = await adminConnection();
  faculty = await insertUser(db, "FACULTY");
});

afterAll(async () => {
  await db.end();
});

const insertOffering = async (status = "RUNNING") => {
  const dept = await insertDepartment(db);
  const courseId = await nextId(db, "courses", "course_id");
  const [course] = await db.query<ResultSetHeader>(
    "INSERT INTO courses (course_code, title, dept_id, semester, credits) VALUES (?, ?, ?, 5, 4)",
    [`TC${String(courseId).padStart(6, "0")}`, `Test course ${courseId}`, dept],
  );
  const termId = await nextId(db, "academic_terms", "term_id");
  const [term] = await db.query<ResultSetHeader>(
    `INSERT INTO academic_terms (name, start_date, end_date)
     VALUES (?, CURDATE() - INTERVAL 60 DAY, CURDATE() + INTERVAL 60 DAY)`,
    [`Test term ${termId}`],
  );
  const [offering] = await db.query<ResultSetHeader>(
    "INSERT INTO course_offerings (course_id, term_id, section, status) VALUES (?, ?, 'A', ?)",
    [course.insertId, term.insertId, status],
  );
  return offering.insertId;
};

const insertUnit = async (offeringId: number, unitNo = 1) => {
  const [unit] = await db.query<ResultSetHeader>(
    `INSERT INTO syllabus_units (offering_id, unit_no, title, topics, hours)
     VALUES (?, ?, ?, 'Relational model and database design', 10)`,
    [offeringId, unitNo, `Unit ${unitNo}`],
  );
  return unit.insertId;
};

const insertChapter = async (editionId: number, chapterNo = 1) => {
  const [chapter] = await db.query<ResultSetHeader>(
    `INSERT INTO chapters (edition_id, chapter_no, title, page_start, page_end, summary)
     VALUES (?, ?, 'The relational model', 1, 40,
             'Relations, keys and the relational algebra exercised by this test.')`,
    [editionId, chapterNo],
  );
  return chapter.insertId;
};

const mapChapter = (unitId: number, chapterId: number, status = "APPROVED") =>
  db.query(
    `INSERT INTO unit_chapter_map
       (unit_id, chapter_id, similarity, source, status, reviewed_by, reviewed_at)
     VALUES (?, ?, 0.900, 'AUTO', ?, ?, NOW(3))`,
    [unitId, chapterId, status, status === "APPROVED" ? faculty : null],
  );

const enroll = async (offeringId: number, count: number) => {
  for (let i = 0; i < count; i++) {
    const student = await insertUser(db, "STUDENT");
    await db.query("INSERT INTO enrollments (student_id, offering_id) VALUES (?, ?)", [
      student,
      offeringId,
    ]);
  }
};

const insertExam = async (offeringId: number, startsInDays: number, endsInDays: number) => {
  const [exam] = await db.query<ResultSetHeader>(
    `INSERT INTO exam_windows (offering_id, exam_type, start_date, end_date)
     VALUES (?, 'END_SEM', CURDATE() + INTERVAL ? DAY, CURDATE() + INTERVAL ? DAY)`,
    [offeringId, startsInDays, endsInDays],
  );
  return exam.insertId;
};

const rowFor = async (offeringId: number) => {
  const rows = await shortagePlanner();
  return rows.find((row) => row.offeringId === offeringId);
};

describe("shortagePlanner", () => {
  it("compares enrolled students with the copies the reading list can lend", async () => {
    const offeringId = await insertOffering();
    const unitId = await insertUnit(offeringId);
    const first = await insertStockedBook(db, 3);
    const second = await insertStockedBook(db, 2);
    await mapChapter(unitId, await insertChapter(first.editionId));
    await mapChapter(unitId, await insertChapter(second.editionId, 2));
    await enroll(offeringId, 5);
    await insertExam(offeringId, 5, 9);

    expect(await rowFor(offeringId)).toMatchObject({
      enrolled: 5,
      assignedBooks: 2,
      usable: 5,
      shortage: 0,
    });
  });

  it("reports a shortage of the exact gap", async () => {
    const offeringId = await insertOffering();
    const unitId = await insertUnit(offeringId);
    const stock = await insertStockedBook(db, 2);
    await mapChapter(unitId, await insertChapter(stock.editionId));
    await enroll(offeringId, 5);

    expect(await rowFor(offeringId)).toMatchObject({
      enrolled: 5,
      usable: 2,
      shortage: 3,
    });
  });

  it("leaves reference copies and copies already out of the count", async () => {
    const offeringId = await insertOffering();
    const unitId = await insertUnit(offeringId);
    const stock = await insertStockedBook(db, 1);
    await mapChapter(unitId, await insertChapter(stock.editionId));
    await insertCopy(db, stock.editionId, { loanPolicy: "REFERENCE_ONLY" });
    await insertCopy(db, stock.editionId, { status: "ON_LOAN" });
    await insertCopy(db, stock.editionId, { status: "DAMAGED" });
    await enroll(offeringId, 3);

    expect(await rowFor(offeringId)).toMatchObject({ usable: 1, shortage: 2 });
  });

  it("counts only approved mappings", async () => {
    const offeringId = await insertOffering();
    const unitId = await insertUnit(offeringId);
    const stock = await insertStockedBook(db, 2);
    await mapChapter(unitId, await insertChapter(stock.editionId), "SUGGESTED");
    await enroll(offeringId, 2);

    expect(await rowFor(offeringId)).toMatchObject({
      assignedBooks: 0,
      usable: 0,
      shortage: 2,
    });
  });

  it("ignores completed offerings", async () => {
    const offeringId = await insertOffering("COMPLETED");
    await enroll(offeringId, 1);

    expect(await rowFor(offeringId)).toBeUndefined();
  });

  it("takes the next exam that has not ended and orders by it", async () => {
    const early = await insertOffering();
    await enroll(early, 1);
    const late = await insertOffering();
    await enroll(late, 1);
    await insertExam(early, 2, 4);
    await insertExam(late, 9, 12);

    const rows = await shortagePlanner();
    const earlyIndex = rows.findIndex((row) => row.offeringId === early);
    const lateIndex = rows.findIndex((row) => row.offeringId === late);
    expect(earlyIndex).toBeGreaterThan(-1);
    expect(lateIndex).toBeGreaterThan(earlyIndex);
  });
});
