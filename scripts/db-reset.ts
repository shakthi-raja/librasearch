import { existsSync } from "node:fs";
import { accounts, provisionAccounts } from "./lib/accounts";
import { accountsEnv, adminConnection, adminEnv, MIGRATIONS_DIR } from "./lib/admin-db";
import { migrate } from "./lib/migrator";

const out = (line: string) => process.stdout.write(`${line}\n`);

// Drops and recreates the development schema, then applies every migration.
async function main() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  if (process.env.NODE_ENV === "production") throw new Error("refusing to reset in production");

  const env = adminEnv();
  const server = await adminConnection(env, { database: false });
  try {
    await server.query(`DROP DATABASE IF EXISTS \`${env.DB_NAME}\``);
    await server.query(
      `CREATE DATABASE \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
    out(`recreated ${env.DB_NAME}`);
  } finally {
    await server.end();
  }

  const db = await adminConnection(env);
  try {
    const applied = await migrate(db, MIGRATIONS_DIR, {
      onApplied: (m, ms) => out(`applied  ${m.file}  ${ms} ms`),
    });
    out(`${applied.length} migration(s) applied`);
    await provisionAccounts(db, accounts(accountsEnv()));
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`db:reset: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
