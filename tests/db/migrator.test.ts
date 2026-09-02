import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MigrationError, migrate, status } from "../../scripts/lib/migrator";
import { adminConnection } from "../support/db";

const FIXTURES = new URL("./fixtures/migrations", import.meta.url).pathname;
let db: Connection;
let dir: string;

async function dropFixtureObjects() {
  await db.query("DROP PROCEDURE IF EXISTS fixture_count");
  await db.query("DROP TABLE IF EXISTS fixture_items");
  await db.query("DROP TABLE IF EXISTS schema_migrations");
}

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

beforeEach(async () => {
  // the real migrations run against the shared test schema in a later suite,
  // so this suite works in its own scratch schema
  await db.query("CREATE DATABASE IF NOT EXISTS migrator_scratch_test");
  await db.query("USE migrator_scratch_test");
  await dropFixtureObjects();
  dir = await mkdtemp(join(tmpdir(), "ls-migrations-"));
  await cp(FIXTURES, dir, { recursive: true });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
  await db.query("DROP DATABASE IF EXISTS migrator_scratch_test");
  await db.changeUser({ database: process.env.DB_NAME ?? "" });
});

describe("migrator", () => {
  it("applies pending files in order and records checksums", async () => {
    const applied = await migrate(db, dir);
    expect(applied.map((m) => m.version)).toEqual(["0001", "0002"]);

    const [rows] = await db.query<RowDataPacket[]>("CALL fixture_count()");
    const result = rows[0] as RowDataPacket[];
    expect(result[0]?.total).toBe(2);

    const [ledger] = await db.query<RowDataPacket[]>(
      "SELECT version, CHAR_LENGTH(checksum) AS len FROM schema_migrations ORDER BY version",
    );
    expect(ledger).toEqual([
      { version: "0001", len: 64 },
      { version: "0002", len: 64 },
    ]);
  });

  it("is idempotent", async () => {
    await migrate(db, dir);
    expect(await migrate(db, dir)).toEqual([]);
  });

  it("refuses to run when an applied file changed", async () => {
    await migrate(db, dir);
    await writeFile(join(dir, "0001_create_items.sql"), "CREATE TABLE edited (id INT);\n");
    await expect(status(db, dir)).rejects.toThrow(/changed after it was applied/);
  });

  it("refuses a new file older than the last applied version", async () => {
    await migrate(db, dir);
    await writeFile(join(dir, "0000_too_late.sql"), "SELECT 1;\n");
    await expect(status(db, dir)).rejects.toThrow(MigrationError);
  });

  it("stops at the failing statement and names the file", async () => {
    await writeFile(join(dir, "0003_broken.sql"), "SELECT 1;\nSELECT * FROM missing_table;\n");
    await expect(migrate(db, dir)).rejects.toThrow(/0003_broken\.sql: statement 2 failed/);
    const [ledger] = await db.query<RowDataPacket[]>("SELECT version FROM schema_migrations");
    expect(ledger.map((row) => row.version)).toEqual(["0001", "0002"]);
  });

  it("rejects badly named files", async () => {
    await writeFile(join(dir, "3_Bad-Name.sql"), "SELECT 1;\n");
    await expect(migrate(db, dir)).rejects.toThrow(/expected NNNN_lower_snake_name/);
  });
});
