import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  applyExamPolicy,
  examWindows,
  expireExamPolicies,
  revertExamPolicy,
} from "@/server/services/exam-policy";
import { insertCopy, insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertDepartment, insertUser, nextId } from "../support/fixtures";

let db: Connection;
let librarian: number;

beforeAll(async () => {
  db = await adminConnection();
  librarian = await insertUser(db, "LIBRARIAN");
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

const insertExam = async (offeringId: number, startsInDays: number, endsInDays: number) => {
  const [exam] = await db.query<ResultSetHeader>(
    `INSERT INTO exam_windows (offering_id, exam_type, start_date, end_date)
     VALUES (?, 'END_SEM', CURDATE() + INTERVAL ? DAY, CURDATE() + INTERVAL ? DAY)`,
    [offeringId, startsInDays, endsInDays],
  );
  return exam.insertId;
};

const insertUnit = async (offeringId: number, unitNo = 1) => {
  const [unit] = await db.query<ResultSetHeader>(
    `INSERT INTO syllabus_units (offering_id, unit_no, title, topics, hours)
     VALUES (?, ?, ?, 'Relational model, keys and relational algebra', 10)`,
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

const approve = (unitId: number, chapterId: number) =>
  db.query(
    `INSERT INTO unit_chapter_map
       (unit_id, chapter_id, similarity, source, status, reviewed_by, reviewed_at)
     VALUES (?, ?, 0.900, 'AUTO', 'APPROVED', ?, NOW(3))`,
    [unitId, chapterId, librarian],
  );

const loanPolicies = async (copyIds: number[]) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT copy_id, loan_policy FROM copies WHERE copy_id IN (?) ORDER BY copy_id",
    [copyIds],
  );
  return rows.map((row) => ({ copyId: Number(row.copy_id), policy: String(row.loan_policy) }));
};

const overrides = async (examId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT override_id, copy_id, previous_policy, applied_policy, ends_on, reverted_at
       FROM policy_overrides WHERE exam_id = ? ORDER BY copy_id`,
    [examId],
  );
  return rows;
};

/** An offering with one unit mapped to one chapter of a two-copy book. */
const offeringWithReadingList = async (copies = 2) => {
  const offeringId = await insertOffering();
  const unitId = await insertUnit(offeringId);
  const stock = await insertStockedBook(db, copies);
  const chapterId = await insertChapter(stock.editionId);
  await approve(unitId, chapterId);
  const examId = await insertExam(offeringId, 2, 6);
  return { offeringId, unitId, examId, ...stock };
};

describe("applyExamPolicy", () => {
  it("shortens every lendable copy on the approved reading list", async () => {
    const list = await offeringWithReadingList(2);
    const other = await insertStockedBook(db, 1);

    const result = await applyExamPolicy(list.examId, "SHORT_LOAN", librarian);

    expect(result).toEqual({ applied: 2, skipped: 0, policy: "SHORT_LOAN" });
    expect(await loanPolicies(list.copyIds)).toEqual([
      { copyId: list.copyIds[0], policy: "SHORT_LOAN" },
      { copyId: list.copyIds[1], policy: "SHORT_LOAN" },
    ]);
    expect(await loanPolicies(other.copyIds)).toEqual([
      { copyId: other.copyIds[0], policy: "REGULAR" },
    ]);

    const rows = await overrides(list.examId);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      previous_policy: "REGULAR",
      applied_policy: "SHORT_LOAN",
      reverted_at: null,
    });
  });

  it("keeps reference copies and reports what it left alone", async () => {
    const offeringId = await insertOffering();
    const unitId = await insertUnit(offeringId);
    const stock = await insertStockedBook(db, 1);
    const chapterId = await insertChapter(stock.editionId);
    await approve(unitId, chapterId);
    const examId = await insertExam(offeringId, 2, 6);

    const reference = await insertCopy(db, stock.editionId, { loanPolicy: "REFERENCE_ONLY" });
    const onLoan = await insertCopy(db, stock.editionId, { status: "ON_LOAN" });

    const result = await applyExamPolicy(examId, "SHORT_LOAN", librarian);

    expect(result.applied).toBe(2);
    expect(result.skipped).toBe(1);
    expect((await loanPolicies([reference]))[0]?.policy).toBe("REFERENCE_ONLY");
    expect((await loanPolicies([onLoan]))[0]?.policy).toBe("SHORT_LOAN");
  });

  it("shows the active policy on the exam window", async () => {
    const list = await offeringWithReadingList(1);
    await applyExamPolicy(list.examId, "REFERENCE_ONLY", librarian);

    const windows = await examWindows();
    const row = windows.find((window) => window.examId === list.examId);
    expect(row).toMatchObject({
      active: 1,
      appliedPolicy: "REFERENCE_ONLY",
      copies: 1,
    });
  });

  it("refuses an offering without an approved reading list", async () => {
    const offeringId = await insertOffering();
    await insertUnit(offeringId);
    const examId = await insertExam(offeringId, 2, 6);

    await expect(applyExamPolicy(examId, "SHORT_LOAN", librarian)).rejects.toThrow(
      /no approved reading list/i,
    );
  });

  it("refuses an exam window that has already closed", async () => {
    const offeringId = await insertOffering();
    const examId = await insertExam(offeringId, -6, -2);

    await expect(applyExamPolicy(examId, "SHORT_LOAN", librarian)).rejects.toThrow(/closed/i);
  });

  it("does not apply twice", async () => {
    const list = await offeringWithReadingList(1);
    await applyExamPolicy(list.examId, "SHORT_LOAN", librarian);

    await expect(applyExamPolicy(list.examId, "REFERENCE_ONLY", librarian)).rejects.toThrow(
      /no lendable copy/i,
    );
  });
});

describe("revertExamPolicy", () => {
  it("restores the policy each copy had before the exam window", async () => {
    const list = await offeringWithReadingList(2);
    await applyExamPolicy(list.examId, "SHORT_LOAN", librarian);

    const restored = await revertExamPolicy(list.examId, librarian);

    expect(restored).toBe(2);
    expect(await loanPolicies(list.copyIds)).toEqual([
      { copyId: list.copyIds[0], policy: "REGULAR" },
      { copyId: list.copyIds[1], policy: "REGULAR" },
    ]);
    const rows = await overrides(list.examId);
    expect(rows.every((row) => row.reverted_at !== null)).toBe(true);
  });

  it("refuses a window with nothing active", async () => {
    const list = await offeringWithReadingList(1);
    await expect(revertExamPolicy(list.examId, librarian)).rejects.toThrow(/no exam policy/i);
  });
});

describe("expireExamPolicies", () => {
  it("undoes overrides once the window is in the past", async () => {
    const list = await offeringWithReadingList(1);
    await applyExamPolicy(list.examId, "SHORT_LOAN", librarian);
    await db.query(
      "UPDATE exam_windows SET start_date = CURDATE() - INTERVAL 10 DAY, end_date = CURDATE() - INTERVAL 2 DAY WHERE exam_id = ?",
      [list.examId],
    );
    await db.query(
      `UPDATE policy_overrides
          SET starts_on = CURDATE() - INTERVAL 12 DAY, ends_on = CURDATE() - INTERVAL 2 DAY
        WHERE exam_id = ?`,
      [list.examId],
    );

    expect(await expireExamPolicies()).toBeGreaterThanOrEqual(1);
    expect((await loanPolicies(list.copyIds))[0]?.policy).toBe("REGULAR");

    const rows = await overrides(list.examId);
    expect(rows[0]?.reverted_at).not.toBeNull();
  });
});
