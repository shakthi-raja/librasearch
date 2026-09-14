import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { embedDocument } from "@/server/vector/embedding";
import { upsertPoint } from "@/server/vector/qdrant";
import { documentFor } from "./documents";
import { log } from "./log";

export type Job = {
  jobId: number;
  entityType: string;
  entityId: number;
  operation: "UPSERT" | "PAYLOAD" | "DELETE";
  attempts: number;
};

const MAX_ATTEMPTS = 3;

/** Claims the next batch without letting two workers take the same row. */
export async function claimJobs(db: Pool, limit: number): Promise<Job[]> {
  const connection: PoolConnection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT job_id, entity_type, entity_id, operation, attempts
         FROM embedding_outbox
        WHERE status = 'PENDING' AND available_at <= NOW(3)
        ORDER BY job_id
        LIMIT ?
        FOR UPDATE SKIP LOCKED`,
      [limit],
    );

    if (rows.length > 0) {
      await connection.query(
        `UPDATE embedding_outbox SET status = 'PROCESSING'
          WHERE job_id IN (${rows.map(() => "?").join(",")})`,
        rows.map((row) => row.job_id),
      );
    }

    await connection.commit();
    return rows.map((row) => ({
      jobId: Number(row.job_id),
      entityType: row.entity_type,
      entityId: Number(row.entity_id),
      operation: row.operation,
      attempts: Number(row.attempts),
    }));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function markDone(db: Pool, jobId: number) {
  await db.query(
    "UPDATE embedding_outbox SET status = 'DONE', processed_at = NOW(3), last_error = NULL WHERE job_id = ?",
    [jobId],
  );
}

/** Retries twice with exponential backoff, then surfaces the failure. */
export async function markFailed(db: Pool, job: Job, error: unknown) {
  const attempts = job.attempts + 1;
  const message = error instanceof Error ? error.message : String(error);
  const failed = attempts >= MAX_ATTEMPTS;

  await db.query(
    `UPDATE embedding_outbox
        SET status = ?, attempts = ?, last_error = ?,
            available_at = DATE_ADD(NOW(3), INTERVAL ? SECOND),
            processed_at = IF(?, NOW(3), NULL)
      WHERE job_id = ?`,
    [
      failed ? "FAILED" : "PENDING",
      attempts,
      message.slice(0, 1000),
      backoffSeconds(attempts),
      failed ? 1 : 0,
      job.jobId,
    ],
  );

  if (failed)
    log.error({ jobId: job.jobId, entity: job.entityType, error: message }, "outbox job failed");
  else log.warn({ jobId: job.jobId, attempts }, "outbox job retried");
}

export function backoffSeconds(attempts: number) {
  return Math.min(5 ** attempts, 300);
}

/** One job at a time. The caller owns marks; a throw means retry. */
export async function processJob(db: Pool, job: Job) {
  if (job.operation !== "UPSERT") {
    throw new Error(`${job.operation} is handled by the payload and delete worker`);
  }

  const document = await documentFor(db, job.entityType, job.entityId);
  if (!document) {
    // The row has gone since the job was queued; dropping it is correct.
    return;
  }

  const vector = await embedDocument(document.text);
  await upsertPoint(document.collection, document.id, vector, document.payload);
}

export async function runOnce(db: Pool, batchSize: number): Promise<number> {
  const jobs = await claimJobs(db, batchSize);
  for (const job of jobs) {
    try {
      await processJob(db, job);
      await markDone(db, job.jobId);
    } catch (error) {
      await markFailed(db, job, error);
    }
  }
  return jobs.length;
}
