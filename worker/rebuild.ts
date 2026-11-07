import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { embedDocument } from "@/server/vector/embedding";
import { dropCollections, ensureCollections, upsertPoint } from "@/server/vector/qdrant";
import { closeWorkerDb, workerDb } from "./db";
import { documentFor } from "./documents";
import { log } from "./log";
import { bumpCatalogueVersion, closeWorkerRedis } from "./redis";

/** Drops the collections and replays every active row from MySQL. */
export async function rebuild() {
  const db = workerDb();
  let points = 0;

  // jobs queued before the replay starts are covered by it
  const [[queued]] = await db.query<RowDataPacket[]>(
    "SELECT COALESCE(MAX(job_id), 0) AS last FROM embedding_outbox",
  );

  await dropCollections();
  await ensureCollections();

  const [books] = await db.query<RowDataPacket[]>(
    "SELECT book_id FROM books WHERE status = 'ACTIVE' ORDER BY book_id",
  );
  const [chapters] = await db.query<RowDataPacket[]>(
    `SELECT c.chapter_id FROM chapters c
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
      WHERE b.status = 'ACTIVE'
      ORDER BY c.chapter_id`,
  );
  const [units] = await db.query<RowDataPacket[]>(
    "SELECT unit_id FROM syllabus_units ORDER BY unit_id",
  );

  const work: [string, number][] = [
    ...books.map((row) => ["BOOK", Number(row.book_id)] as [string, number]),
    ...chapters.map((row) => ["CHAPTER", Number(row.chapter_id)] as [string, number]),
    ...units.map((row) => ["UNIT", Number(row.unit_id)] as [string, number]),
  ];

  for (const [entityType, entityId] of work) {
    const document = await documentFor(db, entityType, entityId);
    if (!document) continue;
    const vector = await embedDocument(document.text);
    await upsertPoint(document.collection, document.id, vector, document.payload);
    points += 1;
  }

  const [settled] = await db.query<ResultSetHeader>(
    `UPDATE embedding_outbox
        SET status = 'DONE', processed_at = NOW(3), last_error = NULL
      WHERE status = 'PENDING' AND job_id <= ?`,
    [Number(queued?.last ?? 0)],
  );

  await bumpCatalogueVersion();
  log.info({ points, superseded: settled.affectedRows }, "rebuild complete");
  return points;
}

if (process.argv[1]?.endsWith("rebuild.ts")) {
  rebuild()
    .then(() => Promise.all([closeWorkerDb(), closeWorkerRedis()]))
    .catch((error) => {
      log.error({ err: error }, "rebuild failed");
      process.exitCode = 1;
    });
}
