import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminConnection } from "../support/db";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

describe("mysql server configuration", () => {
  it("runs the 9.7 lts line", async () => {
    const [rows] = await db.query<RowDataPacket[]>("SELECT VERSION() AS version");
    expect(rows[0]?.version).toMatch(/^9\.7\./);
  });

  it("stores time in utc and has the event scheduler on", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT @@global.time_zone AS tz, @@global.event_scheduler AS events",
    );
    expect(rows[0]).toMatchObject({ tz: "+00:00", events: "ON" });
  });

  it("uses strict sql mode and utf8mb4", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT @@global.sql_mode AS mode, @@collation_database AS collation",
    );
    expect(rows[0]?.mode).toContain("STRICT_TRANS_TABLES");
    expect(rows[0]?.collation).toBe("utf8mb4_0900_ai_ci");
  });

  it("connects to the isolated test schema", async () => {
    const [rows] = await db.query<RowDataPacket[]>("SELECT DATABASE() AS name");
    expect(rows[0]?.name).toMatch(/_test$/);
  });
});
