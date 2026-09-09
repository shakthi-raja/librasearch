import { Redis } from "ioredis";
import { accountsEnvSchema, parseEnv } from "@/lib/config/schema";
import { accounts, provisionAccounts } from "../../scripts/lib/accounts";
import { adminConnection, MIGRATIONS_DIR } from "../../scripts/lib/admin-db";
import { migrate } from "../../scripts/lib/migrator";
import { loadDotEnv, testDatabaseName } from "../support/load-env";

// Recreates the test schema once per run and applies every migration, so each
// run proves the schema builds from empty.
export default async function setup() {
  loadDotEnv();
  const env = parseEnv(accountsEnvSchema, { ...process.env, DB_NAME: testDatabaseName() });

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
    await provisionAccounts(db, accounts(env));
  } finally {
    await db.end();
  }

  // login throttling counters from earlier runs would leak into this one
  if (process.env.REDIS_URL) {
    const client = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
    try {
      await client.connect();
      const keys = await client.keys(`ls:${env.DB_NAME}:*`);
      if (keys.length > 0) await client.del(...keys);
    } catch {
      // without redis the in-process limiter starts empty anyway
    } finally {
      client.disconnect();
    }
  }
}
