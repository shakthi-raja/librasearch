import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";
import { COLLECTIONS, type CollectionName, collection, qdrant } from "@/server/vector/qdrant";
import { rebuild } from "../../../worker/rebuild";

export type VectorStatus = {
  qdrant: Record<string, number | null>;
  expected: Record<string, number>;
  outbox: { status: string; count: number }[];
  jobs: RowDataPacket[];
};

export async function vectorStatus(): Promise<VectorStatus> {
  const db = pool("librarian");
  const [[counts], [outbox], [jobs]] = await Promise.all([
    db.query<RowDataPacket[]>(
      `SELECT (SELECT COUNT(*) FROM chapters) AS chapters,
              (SELECT COUNT(*) FROM books WHERE status = 'ACTIVE') AS books,
              (SELECT COUNT(*) FROM syllabus_units) AS units`,
    ),
    db.query<RowDataPacket[]>(
      "SELECT status, COUNT(*) AS count FROM embedding_outbox GROUP BY status ORDER BY status",
    ),
    db.query<RowDataPacket[]>(
      `SELECT job_id, entity_type, entity_id, operation, status, attempts, last_error, created_at
         FROM embedding_outbox ORDER BY job_id DESC LIMIT 8`,
    ),
  ]);

  const expected = {
    chapters: Number(counts[0]?.chapters ?? 0),
    books: Number(counts[0]?.books ?? 0),
    syllabus_units: Number(counts[0]?.units ?? 0),
  };

  const qdrantCounts: Record<string, number | null> = {};
  for (const name of Object.keys(COLLECTIONS) as CollectionName[]) {
    try {
      const result = await qdrant().count(collection(name), { exact: true });
      qdrantCounts[name] = result.count;
    } catch {
      qdrantCounts[name] = null;
    }
  }

  return {
    qdrant: qdrantCounts,
    expected,
    outbox: outbox.map((row) => ({ status: row.status, count: Number(row.count) })),
    jobs,
  };
}

export function runRebuild() {
  return rebuild();
}
