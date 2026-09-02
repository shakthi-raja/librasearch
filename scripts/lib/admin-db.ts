import mysql from "mysql2/promise";
import { type AdminEnv, adminEnvSchema, parseEnv } from "../../src/lib/config/schema";

export function adminEnv(): AdminEnv {
  return parseEnv(adminEnvSchema, process.env);
}

/** Connection as the schema owner. Used by migrations, seed and tests, never by the app. */
export function adminConnection(env: AdminEnv, options: { database?: boolean } = {}) {
  return mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_ADMIN_USER,
    password: env.DB_ADMIN_PASSWORD,
    ...(options.database === false ? {} : { database: env.DB_NAME }),
    timezone: "Z",
    charset: "utf8mb4_0900_ai_ci",
  });
}

export const MIGRATIONS_DIR = new URL("../../db/migrations", import.meta.url).pathname;
