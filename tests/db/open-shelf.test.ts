import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { findBook } from "@/server/repositories/book";
import { insertBook, insertCategory, insertEdition } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { ER, expectSqlError } from "../support/sql-errors";

let db: Connection;
let bookId: number;

beforeAll(async () => {
  db = await adminConnection();
  bookId = await insertBook(db, await insertCategory(db));
  await insertEdition(db, bookId);
});

afterAll(async () => {
  await db.end();
});

const link = (url: string, extra: Record<string, unknown> = {}) =>
  db.query("INSERT INTO open_resources SET ?", [
    { book_id: bookId, url, provider: "The authors", ...extra },
  ]);

describe("open_resources", () => {
  it("links only to https pages and only once per book", async () => {
    await expectSqlError(link("http://example.org/book"), ER.CHECK_CONSTRAINT_VIOLATED);
    await link("https://example.org/book");
    await expectSqlError(link("https://example.org/book"), ER.DUP_ENTRY);
  });

  it("shows working links on the book and hides broken ones", async () => {
    await link("https://example.org/chapters", { kind: "CHAPTERS", licence: "CC BY 4.0" });
    await link("https://example.org/gone", { status: "BROKEN" });

    const book = await findBook(pool("student"), bookId);
    expect(book?.openResources).toEqual([
      {
        url: "https://example.org/book",
        kind: "FULL_TEXT",
        provider: "The authors",
        licence: null,
      },
      {
        url: "https://example.org/chapters",
        kind: "CHAPTERS",
        provider: "The authors",
        licence: "CC BY 4.0",
      },
    ]);
  });

  it("is readable by students only through the view", async () => {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM v_open_shelf WHERE book_id = ?",
      [bookId],
    );
    expect(Number(rows[0]?.n)).toBe(2);
    await expect(
      pool("student").query("SELECT url FROM open_resources LIMIT 1"),
    ).rejects.toMatchObject({ errno: ER.TABLEACCESS_DENIED });
  });
});
