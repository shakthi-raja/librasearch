import "server-only";
import mysql, { type Pool } from "mysql2/promise";
import { env } from "@/lib/config/env";

/**
 * One pool per database account. The account decides what MySQL lets a
 * request do, so a handler picks the narrowest account that can serve it.
 */
export type DbAccount = "auth" | "student" | "faculty" | "librarian";

const globalForDb = globalThis as unknown as { librasearchPools?: Map<DbAccount, Pool> };
globalForDb.librasearchPools ??= new Map<DbAccount, Pool>();
const pools = globalForDb.librasearchPools;

function credentials(account: DbAccount) {
  const e = env();
  switch (account) {
    case "auth":
      return { user: e.DB_AUTH_USER, password: e.DB_AUTH_PASSWORD };
    case "student":
      return { user: e.DB_STUDENT_USER, password: e.DB_STUDENT_PASSWORD };
    case "faculty":
      return { user: e.DB_FACULTY_USER, password: e.DB_FACULTY_PASSWORD };
    case "librarian":
      return { user: e.DB_LIBRARIAN_USER, password: e.DB_LIBRARIAN_PASSWORD };
  }
}

export function pool(account: DbAccount): Pool {
  const existing = pools.get(account);
  if (existing) return existing;

  const e = env();
  const created = mysql.createPool({
    host: e.DB_HOST,
    port: e.DB_PORT,
    database: e.DB_NAME,
    ...credentials(account),
    connectionLimit: e.DB_POOL_SIZE,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    timezone: "Z",
    charset: "utf8mb4_0900_ai_ci",
    decimalNumbers: false,
    supportBigNumbers: true,
    bigNumberStrings: false,
  });
  pools.set(account, created);
  return created;
}

export async function closePools() {
  await Promise.all([...pools.values()].map((p) => p.end()));
  pools.clear();
}
