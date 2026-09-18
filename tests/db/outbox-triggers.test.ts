import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { insertBook, insertCategory, insertEdition, insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertDepartment } from "../support/fixtures";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

const outbox = async (entityType: string, entityId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT operation, status FROM embedding_outbox WHERE entity_type = ? AND entity_id = ? ORDER BY job_id DESC LIMIT 1",
    [entityType, entityId],
  );
  return rows[0] as { operation: string; status: string } | undefined;
};

const insertChapter = async (editionId: number) => {
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO chapters (edition_id, chapter_no, title, page_start, page_end, summary) VALUES (?, 1, 'Normal forms', 1, 30, 'Functional dependencies and normal forms remove redundancy from a relation.')",
    [editionId],
  );
  return result.insertId;
};

describe("catalogue outbox", () => {
  it("queues a book and its edition on insert", async () => {
    const { bookId, editionId } = await insertStockedBook(db, 1);
    expect(await outbox("BOOK", bookId)).toMatchObject({ operation: "UPSERT", status: "PENDING" });
    expect(await outbox("EDITION", editionId)).toMatchObject({ operation: "UPSERT" });
  });

  it("queues the chapter on insert, text change and page change", async () => {
    const categoryId = await insertCategory(db);
    const bookId = await insertBook(db, categoryId);
    const editionId = await insertEdition(db, bookId);
    const chapterId = await insertChapter(editionId);
    expect(await outbox("CHAPTER", chapterId)).toMatchObject({ operation: "UPSERT" });

    await db.query("UPDATE chapters SET summary = ? WHERE chapter_id = ?", [
      "A rewritten summary that still covers functional dependencies and normal forms.",
      chapterId,
    ]);
    expect(await outbox("CHAPTER", chapterId)).toMatchObject({ operation: "UPSERT" });

    await db.query("UPDATE chapters SET page_end = 40 WHERE chapter_id = ?", [chapterId]);
    expect(await outbox("CHAPTER", chapterId)).toMatchObject({ operation: "PAYLOAD" });
  });

  it("queues a book text change, metadata change, withdrawal and reinstatement", async () => {
    const { bookId } = await insertStockedBook(db, 1);

    await db.query("UPDATE books SET title = ? WHERE book_id = ?", ["A new title", bookId]);
    expect(await outbox("BOOK", bookId)).toMatchObject({ operation: "UPSERT" });

    await db.query("UPDATE books SET language = 'fr' WHERE book_id = ?", [bookId]);
    expect(await outbox("BOOK", bookId)).toMatchObject({ operation: "PAYLOAD" });

    await db.query("UPDATE books SET status = 'WITHDRAWN' WHERE book_id = ?", [bookId]);
    expect(await outbox("BOOK", bookId)).toMatchObject({ operation: "DELETE" });

    await db.query("UPDATE books SET status = 'ACTIVE' WHERE book_id = ?", [bookId]);
    expect(await outbox("BOOK", bookId)).toMatchObject({ operation: "UPSERT" });
  });

  it("queues a chapter delete", async () => {
    const categoryId = await insertCategory(db);
    const bookId = await insertBook(db, categoryId);
    const editionId = await insertEdition(db, bookId);
    const chapterId = await insertChapter(editionId);
    await db.query("DELETE FROM chapters WHERE chapter_id = ?", [chapterId]);
    expect(await outbox("CHAPTER", chapterId)).toMatchObject({ operation: "DELETE" });
  });
});

describe("syllabus outbox", () => {
  it("queues a unit on insert, text change and delete", async () => {
    const deptId = await insertDepartment(db);
    const n = await db.query<RowDataPacket[]>(
      "SELECT COALESCE(MAX(course_id), 0) + 1 AS n FROM courses",
    );
    const courseId = Number(n[0]?.[0]?.n);
    const [course] = await db.query<ResultSetHeader>(
      "INSERT INTO courses (course_code, title, dept_id, semester, credits) VALUES (?, 'Outbox course', ?, 4, 4)",
      [`OBX${String(courseId).padStart(5, "0")}`, deptId],
    );
    const [term] = await db.query<ResultSetHeader>(
      "INSERT INTO academic_terms (name, start_date, end_date) VALUES (?, '2026-01-05', '2026-05-29')",
      [`Outbox term ${courseId}`],
    );
    const [offering] = await db.query<ResultSetHeader>(
      "INSERT INTO course_offerings (course_id, term_id, section) VALUES (?, ?, 'A')",
      [course.insertId, term.insertId],
    );
    const [unit] = await db.query<ResultSetHeader>(
      "INSERT INTO syllabus_units (offering_id, unit_no, title, topics, hours) VALUES (?, 1, 'Normalisation', 'Functional dependencies and normal forms', 4)",
      [offering.insertId],
    );
    expect(await outbox("UNIT", unit.insertId)).toMatchObject({ operation: "UPSERT" });

    await db.query(
      "UPDATE syllabus_units SET topics = 'A rewritten topic list' WHERE unit_id = ?",
      [unit.insertId],
    );
    expect(await outbox("UNIT", unit.insertId)).toMatchObject({ operation: "UPSERT" });

    await db.query("DELETE FROM syllabus_units WHERE unit_id = ?", [unit.insertId]);
    expect(await outbox("UNIT", unit.insertId)).toMatchObject({ operation: "DELETE" });
  });
});
