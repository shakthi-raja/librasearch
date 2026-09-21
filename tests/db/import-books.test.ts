import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { importBooks, previewImport } from "@/server/services/import-books";
import { insertCategory, isbn13 } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;
let librarian: number;
let categoryId: number;

beforeAll(async () => {
  db = await adminConnection();
  librarian = await insertUser(db, "LIBRARIAN");
  categoryId = await insertCategory(db);
});

afterAll(async () => {
  await db.end();
});

const csvFor = (isbn: string, title = "Imported Book") =>
  [
    "title,authors,isbn13,category,copies,year",
    `${title},First Author;Second Author,${isbn},test-category-${categoryId},3,2021`,
  ].join("\n");

const bookRow = async (title: string) => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT b.book_id, e.edition_id, e.isbn13, COUNT(c.copy_id) AS copies
       FROM books b
       JOIN editions e ON e.book_id = b.book_id
       LEFT JOIN copies c ON c.edition_id = e.edition_id
      WHERE b.title = ?
      GROUP BY b.book_id, e.edition_id, e.isbn13`,
    [title],
  );
  const found = rows[0];
  if (!found) throw new Error(`book ${title} not found`);
  return found;
};

describe("previewImport", () => {
  it("resolves the stored category and reports a clean row", async () => {
    const isbn = isbn13(`978${String(Date.now()).slice(-9)}`);
    const preview = await previewImport(csvFor(isbn));

    expect(preview.error).toBeUndefined();
    expect(preview.valid).toBe(1);
    expect(preview.rows[0]?.categoryId).toBe(categoryId);
  });

  it("flags an ISBN that the catalogue already holds", async () => {
    const isbn = isbn13(`978${String(Date.now() + 1).slice(-9)}`);
    await importBooks(csvFor(isbn, "Already Here"), librarian);

    const preview = await previewImport(csvFor(isbn, "Second Copy"));
    expect(preview.rows[0]?.issues.join(" ")).toMatch(/already in the catalogue/i);
  });
});

describe("importBooks", () => {
  it("creates the book, its edition and the requested copies", async () => {
    const isbn = isbn13(`978${String(Date.now() + 2).slice(-9)}`);
    const result = await importBooks(csvFor(isbn, "Fresh Import"), librarian);

    expect(result).toEqual({ imported: 1, skipped: 0 });
    const book = await bookRow("Fresh Import");
    expect(book.isbn13).toBe(isbn);
    expect(Number(book.copies)).toBe(3);

    const [authors] = await db.query<RowDataPacket[]>(
      `SELECT a.full_name FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
        WHERE ba.book_id = ? ORDER BY ba.author_order`,
      [book.book_id],
    );
    expect(authors.map((row) => row.full_name)).toEqual(["First Author", "Second Author"]);
  });

  it("refuses a file with no valid rows", async () => {
    const csv = ["title,authors,isbn13,category", "Broken,,nope,nowhere"].join("\n");
    await expect(importBooks(csv, librarian)).rejects.toThrow(/no valid rows/i);
  });
});
