import { existsSync } from "node:fs";
import { adminConnection, adminEnv, MIGRATIONS_DIR } from "./lib/admin-db";
import { migrate, status } from "./lib/migrator";

const out = (line: string) => process.stdout.write(`${line}\n`);

async function main() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const command = process.argv[2] ?? "up";
  const env = adminEnv();
  const db = await adminConnection(env);

  try {
    if (command === "status") {
      const { applied, pending } = await status(db, MIGRATIONS_DIR);
      for (const m of applied) out(`applied  ${m.version}_${m.name}  ${m.appliedAt.toISOString()}`);
      for (const m of pending) out(`pending  ${m.file}`);
      out(`${applied.length} applied, ${pending.length} pending`);
      return;
    }
    if (command !== "up") throw new Error(`unknown command "${command}", use up or status`);

    const applied = await migrate(db, MIGRATIONS_DIR, {
      onApplied: (m, ms) => out(`applied  ${m.file}  ${ms} ms`),
    });
    out(applied.length === 0 ? "schema is up to date" : `${applied.length} migration(s) applied`);
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`migrate: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
