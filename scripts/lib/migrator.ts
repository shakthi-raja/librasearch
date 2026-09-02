import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { splitSql } from "./sql-split";

const FILE_PATTERN = /^(\d{4})_([a-z0-9_]+)\.sql$/;
const LOCK_NAME = "librasearch.migrate";

export type Migration = {
  version: string;
  name: string;
  file: string;
  checksum: string;
  sql: string;
};

export type AppliedMigration = {
  version: string;
  name: string;
  checksum: string;
  appliedAt: Date;
  executionMs: number;
};

export type MigrationStatus = {
  applied: AppliedMigration[];
  pending: Migration[];
};

export class MigrationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "MigrationError";
  }
}

export async function loadMigrations(directory: string): Promise<Migration[]> {
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  const migrations: Migration[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const match = FILE_PATTERN.exec(file);
    if (!match?.[1] || !match[2]) {
      throw new MigrationError(`${file}: expected NNNN_lower_snake_name.sql`);
    }
    if (seen.has(match[1])) throw new MigrationError(`${file}: version ${match[1]} is used twice`);
    seen.add(match[1]);
    const sql = await readFile(join(directory, file), "utf8");
    const checksum = createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex");
    migrations.push({ version: match[1], name: match[2], file, checksum, sql });
  }
  return migrations;
}

async function ensureLedger(db: Connection) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version      CHAR(4)      NOT NULL,
      name         VARCHAR(120) NOT NULL,
      checksum     CHAR(64)     NOT NULL,
      applied_at   DATETIME(3)  NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
      execution_ms INT UNSIGNED NOT NULL,
      CONSTRAINT pk_schema_migrations PRIMARY KEY (version)
    ) ENGINE = InnoDB
  `);
}

async function readLedger(db: Connection): Promise<AppliedMigration[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT version, name, checksum, applied_at, execution_ms
       FROM schema_migrations
      ORDER BY version`,
  );
  return rows.map((row) => ({
    version: String(row.version),
    name: String(row.name),
    checksum: String(row.checksum),
    appliedAt: new Date(row.applied_at),
    executionMs: Number(row.execution_ms),
  }));
}

/** Compares files with the ledger. An applied file that changed is an error, never a re-run. */
export async function status(db: Connection, directory: string): Promise<MigrationStatus> {
  await ensureLedger(db);
  const [migrations, applied] = await Promise.all([loadMigrations(directory), readLedger(db)]);
  const byVersion = new Map(migrations.map((m) => [m.version, m]));

  for (const row of applied) {
    const file = byVersion.get(row.version);
    if (!file) throw new MigrationError(`${row.version}_${row.name}: applied but the file is gone`);
    if (file.checksum !== row.checksum) {
      throw new MigrationError(`${file.file}: changed after it was applied, add a new migration`);
    }
  }

  const appliedVersions = new Set(applied.map((row) => row.version));
  const pending = migrations.filter((m) => !appliedVersions.has(m.version));
  const lastApplied = applied.at(-1)?.version;
  const outOfOrder = pending.find((m) => lastApplied !== undefined && m.version < lastApplied);
  if (outOfOrder) {
    throw new MigrationError(
      `${outOfOrder.file}: older than the last applied version ${lastApplied}`,
    );
  }
  return { applied, pending };
}

export type MigrateOptions = {
  onApplied?: (migration: Migration, executionMs: number) => void;
};

/** Applies pending migrations in order under an advisory lock. */
export async function migrate(db: Connection, directory: string, options: MigrateOptions = {}) {
  const [lock] = await db.query<RowDataPacket[]>("SELECT GET_LOCK(?, 30) AS acquired", [LOCK_NAME]);
  if (lock[0]?.acquired !== 1) throw new MigrationError("another migration run holds the lock");

  try {
    const { pending } = await status(db, directory);
    for (const migration of pending) {
      const started = performance.now();
      for (const [index, statement] of splitSql(migration.sql).entries()) {
        try {
          await db.query(statement);
        } catch (error) {
          throw new MigrationError(
            `${migration.file}: statement ${index + 1} failed: ${(error as Error).message}`,
            { cause: error },
          );
        }
      }
      const executionMs = Math.round(performance.now() - started);
      await db.query(
        "INSERT INTO schema_migrations (version, name, checksum, execution_ms) VALUES (?, ?, ?, ?)",
        [migration.version, migration.name, migration.checksum, executionMs],
      );
      options.onApplied?.(migration, executionMs);
    }
    return pending;
  } finally {
    await db.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]);
  }
}
