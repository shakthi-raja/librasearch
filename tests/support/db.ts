import mysql from "mysql2/promise";
import { adminEnvSchema, parseEnv } from "@/lib/config/schema";

/** Admin connection to the test schema. Tests own and close what they open. */
export async function adminConnection(options: { multipleStatements?: boolean } = {}) {
  const admin = parseEnv(adminEnvSchema, process.env);
  return mysql.createConnection({
    host: admin.DB_HOST,
    port: admin.DB_PORT,
    user: admin.DB_ADMIN_USER,
    password: admin.DB_ADMIN_PASSWORD,
    database: admin.DB_NAME,
    timezone: "Z",
    dateStrings: false,
    multipleStatements: options.multipleStatements ?? false,
  });
}

/** Pool for code that needs `getConnection`, such as the worker claim. */
export async function adminPool() {
  const admin = parseEnv(adminEnvSchema, process.env);
  return mysql.createPool({
    host: admin.DB_HOST,
    port: admin.DB_PORT,
    user: admin.DB_ADMIN_USER,
    password: admin.DB_ADMIN_PASSWORD,
    database: admin.DB_NAME,
    timezone: "Z",
    connectionLimit: 4,
  });
}
