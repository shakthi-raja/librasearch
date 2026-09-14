import type { Connection, Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ensureCollections, qdrant, qdrantReady } from "@/server/vector/qdrant";
import { claimJobs, markFailed, runOnce } from "../../worker/jobs";
import { insertStockedBook } from "../support/catalogue";
import { adminConnection, adminPool } from "../support/db";

const ready = await qdrantReady();
let db: Connection;
let pool: Pool;

async function insertChapter(editionId: number) {
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO chapters (edition_id, chapter_no, title, page_start, page_end, summary) VALUES (?, 1, 'Normal forms', 1, 30, 'Functional dependencies and normal forms remove redundancy from a relation.')",
    [editionId],
  );
  return result.insertId;
}

async function pointsFor(collection: "chapters" | "books", key: string, value: number) {
  const result = await qdrant().scroll(collection, {
    filter: { must: [{ key, match: { value } }] },
    with_payload: true,
    limit: 20,
  });
  return result.points;
}

describe.skipIf(!ready)("worker", () => {
  beforeAll(async () => {
    db = await adminConnection();
    pool = await adminPool();
    await ensureCollections();
    await db.query("DELETE FROM embedding_outbox");
  });

  afterAll(async () => {
    await pool.end();
    await db.end();
  });

  it("embeds a queued chapter and stores its filterable payload", async () => {
    const { bookId, editionId } = await insertStockedBook(db, 0);
    const chapterId = await insertChapter(editionId);

    const processed = await runOnce(pool, 20);
    expect(processed).toBeGreaterThanOrEqual(2);

    const points = await pointsFor("chapters", "chapter_id", chapterId);
    expect(points).toHaveLength(1);
    expect(points[0]?.payload).toMatchObject({
      chapter_id: chapterId,
      book_id: bookId,
      edition_id: editionId,
    });

    const bookPoints = await pointsFor("books", "book_id", bookId);
    expect(bookPoints).toHaveLength(1);
  });

  it("removes a withdrawn book and every chapter point under it", async () => {
    const { bookId, editionId } = await insertStockedBook(db, 0);
    const chapterId = await insertChapter(editionId);
    await runOnce(pool, 20);
    expect(await pointsFor("chapters", "chapter_id", chapterId)).toHaveLength(1);

    await db.query("UPDATE books SET status = 'WITHDRAWN' WHERE book_id = ?", [bookId]);
    await runOnce(pool, 20);

    expect(await pointsFor("books", "book_id", bookId)).toHaveLength(0);
    expect(await pointsFor("chapters", "book_id", bookId)).toHaveLength(0);
  });

  it("backs off before marking a job failed", async () => {
    const [row] = await db.query<ResultSetHeader>(
      "INSERT INTO embedding_outbox (entity_type, entity_id, operation) VALUES ('CHAPTER', 999999, 'UPSERT')",
    );
    const [claimed] = await claimJobs(pool, 1);
    expect(claimed?.jobId).toBe(row.insertId);

    await markFailed(
      pool,
      {
        jobId: row.insertId,
        entityType: "CHAPTER",
        entityId: 999999,
        operation: "UPSERT",
        attempts: 0,
      },
      new Error("qdrant refused the point"),
    );

    const [jobs] = await db.query<RowDataPacket[]>(
      "SELECT status, attempts, last_error, available_at FROM embedding_outbox WHERE job_id = ?",
      [row.insertId],
    );
    expect(jobs[0]).toMatchObject({ status: "PENDING", attempts: 1 });
    expect(String(jobs[0]?.last_error)).toContain("qdrant refused");
    expect(new Date(jobs[0]?.available_at as Date).getTime()).toBeGreaterThan(Date.now());
  });
});
