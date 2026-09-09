import "server-only";
import type { Pool, PoolConnection } from "mysql2/promise";

const DEADLOCK = 1213;
const LOCK_WAIT_TIMEOUT = 1205;

/**
 * Runs work in one transaction on a pooled connection. A deadlock or lock
 * timeout retries the whole unit up to three times with jittered backoff;
 * anything else rolls back and rethrows.
 */
export async function withTransaction<T>(
  pool: Pool,
  work: (conn: PoolConnection) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await work(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback().catch(() => undefined);
      const errno = (error as { errno?: number }).errno;
      if ((errno === DEADLOCK || errno === LOCK_WAIT_TIMEOUT) && attempt < 3) {
        await new Promise((r) => setTimeout(r, 20 * attempt + Math.random() * 30));
        continue;
      }
      throw error;
    } finally {
      conn.release();
    }
  }
}
