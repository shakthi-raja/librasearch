import { adminEnvSchema, parseEnv } from "@/lib/config/schema";
import { adminConnection, MIGRATIONS_DIR } from "../../scripts/lib/admin-db";
import { migrate } from "../../scripts/lib/migrator";
import { loadDotEnv, testDatabaseName } from "../support/load-env";

// Recreates the test schema once per run and applies every migration, so each
// run proves the schema builds from empty.
export default async function setup() {
  loadDotEnv();
  const env = parseEnv(adminEnvSchema, { ...process.env, DB_NAME: testDatabaseName() });

  const server = await adminConnection(env, { database: false });
  try {
    await server.query(`DROP DATABASE IF EXISTS \`${env.DB_NAME}\``);
    await server.query(
      `CREATE DATABASE \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
  } finally {
    await server.end();
  }

  const db = await adminConnection(env);
  try {
    await migrate(db, MIGRATIONS_DIR);
  } finally {
    await db.end();
  }
}
