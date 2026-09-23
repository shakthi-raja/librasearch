import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runSearch } from "@/server/search/run";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

const nonsense = () =>
  Array.from({ length: 10 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join(
    "",
  );

const logged = async (query: string) => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT user_id, mode, result_count, filters FROM search_log
      WHERE query_text = ? ORDER BY search_id`,
    [query],
  );
  return rows;
};

describe("runSearch", () => {
  it("records a guest search with its mode and result count", async () => {
    const query = `${nonsense()} ${nonsense()}`;
    const result = await runSearch(query, "keyword", { language: "en" });

    const rows = await logged(query);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ user_id: null, mode: "KEYWORD", result_count: 0 });
    expect(rows[0]?.filters).toEqual({ language: "en" });
    expect(result.hits).toEqual([]);
  });

  it("records who searched when someone is signed in", async () => {
    const student = await insertUser(db, "STUDENT");
    const query = nonsense();
    await runSearch(query, "keyword", {}, student);

    const rows = await logged(query);
    expect(rows[0]?.user_id).toBe(student);
  });
});
