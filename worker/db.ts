import mysql from "mysql2/promise";
import { env } from "@/lib/config/env";

let pool: mysql.Pool | undefined;

/** The worker reads the catalogue and updates the outbox as the librarian account. */
export function workerDb() {
  if (pool) return pool;
  const e = env();
  pool = mysql.createPool({
    host: e.DB_HOST,
    port: e.DB_PORT,
    database: e.DB_NAME,
    user: e.DB_LIBRARIAN_USER,
    password: e.DB_LIBRARIAN_PASSWORD,
    connectionLimit: 4,
    waitForConnections: true,
    queueLimit: 0,
    timezone: "Z",
    charset: "utf8mb4_0900_ai_ci",
  });
  return pool;
}

export async function closeWorkerDb() {
  if (pool) await pool.end();
  pool = undefined;
}
