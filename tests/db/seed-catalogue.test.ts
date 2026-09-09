import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedCatalogue } from "../../db/seed/catalogue";
import { BOOKS } from "../../db/seed/catalogue-data";
import { rackCentre } from "../../src/components/stack-map/layout";
import { adminConnection } from "../support/db";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
  await seedCatalogue(db);
});

afterAll(async () => {
  await db.end();
});

const scalar = async (sql: string) => {
  const [rows] = await db.query<RowDataPacket[]>(sql);
  return Number(Object.values(rows[0] ?? {})[0]);
};

describe("curated catalogue", () => {
  it("loads every edition and is idempotent", async () => {
    const isbns = BOOKS.flatMap((b) => b.editions.map((e) => e.isbn13));
    const count = () =>
      scalar(
        `SELECT COUNT(*) FROM editions WHERE isbn13 IN (${isbns.map((i) => `'${i}'`).join(",")})`,
      );
    expect(await count()).toBe(isbns.length);
    await seedCatalogue(db);
    expect(await count()).toBe(isbns.length);
  });

  it("links later editions to the one before", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT e.edition_no, p.edition_no AS previous_no
         FROM editions e JOIN editions p ON p.edition_id = e.previous_edition_id
        WHERE e.isbn13 = '9780078022159'`,
    );
    expect(rows[0]).toEqual({ edition_no: 7, previous_no: 6 });
  });

  it("shelves every book on a rack that exists on the stack map", () => {
    for (const book of BOOKS)
      expect(rackCentre(book.rack), `${book.title} -> ${book.rack}`).toBeDefined();
  });

  it("gives the normalisation chapters the best keyword match for normal forms", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT title FROM chapters
        ORDER BY MATCH (title, summary) AGAINST ('normal forms decomposition') DESC
        LIMIT 3`,
    );
    for (const row of rows) expect(String(row.title)).toMatch(/normal|design|dependenc/i);
  });
});
