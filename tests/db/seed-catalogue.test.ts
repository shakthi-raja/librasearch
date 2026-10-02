import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedCatalogue } from "../../db/seed/catalogue";
import { BOOKS as CURATED } from "../../db/seed/catalogue-data";
import { SYLLABUS_BOOKS } from "../../db/seed/syllabus-books";
import { ELECTIVE_BOOKS } from "../../db/seed/syllabus-electives";
import { rackCentre } from "../../src/components/stack-map/layout";
import { keywordSearch } from "../../src/server/search/keyword";
import { adminConnection } from "../support/db";

const BOOKS = [...CURATED, ...SYLLABUS_BOOKS, ...ELECTIVE_BOOKS];

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

  it("holds valid, distinct ISBN-13s across the curated and syllabus lists", () => {
    const isbns = BOOKS.flatMap((b) => b.editions.map((e) => e.isbn13));
    expect(new Set(isbns).size).toBe(isbns.length);
    for (const isbn of isbns) {
      const sum = [...isbn.slice(0, 12)].reduce(
        (acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3),
        0,
      );
      expect((10 - (sum % 10)) % 10, isbn).toBe(Number(isbn[12]));
    }
  });

  it("shelves every book on a rack that exists on the stack map", () => {
    for (const book of BOOKS)
      expect(rackCentre(book.rack), `${book.title} -> ${book.rack}`).toBeDefined();
  });

  it("gives the normalisation chapters the best keyword match for normal forms", async () => {
    const hits = await keywordSearch("normal forms decomposition");
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits.slice(0, 3))
      expect(hit.chapterTitle).toMatch(/normal|design|dependenc|refinement/i);
  });
});
