import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  insertBook,
  insertCategory,
  insertCopy,
  insertEdition,
  insertStockedBook,
  isbn13,
} from "../support/catalogue";
import { adminConnection } from "../support/db";
import { ER, expectSqlError } from "../support/sql-errors";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

describe("editions", () => {
  it("accepts a real isbn-13 and rejects a wrong check digit", async () => {
    const bookId = await insertBook(db, await insertCategory(db));
    await db.query(
      "INSERT INTO editions (book_id, isbn13, edition_no, pub_year, page_count) VALUES (?, '9780201616224', 1, 1999, 352)",
      [bookId],
    );
    await expectSqlError(
      db.query(
        "INSERT INTO editions (book_id, isbn13, edition_no, pub_year, page_count) VALUES (?, '9780201616223', 2, 2019, 352)",
        [bookId],
      ),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_editions_isbn_checksum/,
    );
  });

  it("keeps edition numbers unique within a book", async () => {
    const bookId = await insertBook(db, await insertCategory(db));
    await insertEdition(db, bookId, { editionNo: 2 });
    await expectSqlError(
      insertEdition(db, bookId, { editionNo: 2 }),
      ER.DUP_ENTRY,
      /uq_editions_number/,
    );
  });

  it("links a previous edition only within the same book and to a lower number", async () => {
    const categoryId = await insertCategory(db);
    const bookId = await insertBook(db, categoryId);
    const first = await insertEdition(db, bookId, { editionNo: 1 });
    await insertEdition(db, bookId, { editionNo: 2, previousEditionId: first });

    const otherBook = await insertBook(db, categoryId);
    await expectSqlError(
      insertEdition(db, otherBook, { editionNo: 3, previousEditionId: first }),
      ER.SIGNAL_EXCEPTION,
      /LS202/,
    );
  });
});

describe("chapters", () => {
  it("must sit inside the page count of their edition", async () => {
    const editionId = await insertEdition(db, await insertBook(db, await insertCategory(db)), {
      pages: 300,
    });
    await expectSqlError(
      db.query(
        "INSERT INTO chapters (edition_id, chapter_no, title, page_start, page_end, summary) VALUES (?, 1, 'Late', 290, 320, REPEAT('summary ', 8))",
        [editionId],
      ),
      ER.SIGNAL_EXCEPTION,
      /LS203/,
    );
  });

  it("rejects a page range that runs backwards and a thin summary", async () => {
    const editionId = await insertEdition(db, await insertBook(db, await insertCategory(db)));
    await expectSqlError(
      db.query(
        "INSERT INTO chapters (edition_id, chapter_no, title, page_start, page_end, summary) VALUES (?, 1, 'Back', 50, 40, REPEAT('summary ', 8))",
        [editionId],
      ),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_chapters_pages/,
    );
    await expectSqlError(
      db.query(
        "INSERT INTO chapters (edition_id, chapter_no, title, page_start, page_end, summary) VALUES (?, 2, 'Thin', 1, 10, 'Too short')",
        [editionId],
      ),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_chapters_summary/,
    );
  });
});

describe("copies", () => {
  it.each([
    ["barcode", { barcode: "123" }, /ck_copies_barcode/],
    ["rack", { rack_code: "cs4" }, /ck_copies_rack/],
    ["accession number", { accession_no: "A-1" }, /ck_copies_accession/],
  ])("rejects a malformed %s", async (_label, values, constraint) => {
    const editionId = await insertEdition(db, await insertBook(db, await insertCategory(db)));
    await expectSqlError(
      db.query("INSERT INTO copies SET ?", [
        {
          edition_id: editionId,
          accession_no: "ACC-2026-99999",
          barcode: "LS99999999",
          rack_code: "CS-01",
          shelf_code: "S1",
          acquired_on: "2026-06-01",
          ...values,
        },
      ]),
      ER.CHECK_CONSTRAINT_VIOLATED,
      constraint,
    );
  });

  it("never lets a reference-only copy be on loan", async () => {
    const editionId = await insertEdition(db, await insertBook(db, await insertCategory(db)));
    const copyId = await insertCopy(db, editionId, { loanPolicy: "REFERENCE_ONLY" });
    await expectSqlError(
      db.query("UPDATE copies SET status = 'ON_LOAN' WHERE copy_id = ?", [copyId]),
      ER.CHECK_CONSTRAINT_VIOLATED,
      /ck_copies_reference_on_loan/,
    );
  });

  it("cannot be orphaned by deleting its edition", async () => {
    const { editionId } = await insertStockedBook(db, 1);
    await expectSqlError(
      db.query("DELETE FROM editions WHERE edition_id = ?", [editionId]),
      ER.ROW_IS_REFERENCED,
    );
  });
});

describe("categories", () => {
  it("refuse to become their own ancestor", async () => {
    const root = await insertCategory(db);
    const child = await insertCategory(db, root);
    const grandchild = await insertCategory(db, child);
    await expectSqlError(
      db.query("UPDATE categories SET parent_id = ? WHERE category_id = ?", [grandchild, root]),
      ER.SIGNAL_EXCEPTION,
      /LS201/,
    );
    await expectSqlError(
      db.query("UPDATE categories SET parent_id = category_id WHERE category_id = ?", [child]),
      ER.SIGNAL_EXCEPTION,
      /LS201/,
    );
  });

  it("report their full path through the recursive view", async () => {
    const root = await insertCategory(db);
    const child = await insertCategory(db, root);
    const leaf = await insertCategory(db, child);
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT depth, root_id, path FROM v_category_tree WHERE category_id = ?",
      [leaf],
    );
    expect(rows[0]?.depth).toBe(2);
    expect(rows[0]?.root_id).toBe(root);
    expect(String(rows[0]?.path).split(" / ")).toHaveLength(3);
  });
});

describe("availability", () => {
  it("counts only borrowable copies on the shelf", async () => {
    const { bookId, editionId } = await insertStockedBook(db, 2);
    await insertCopy(db, editionId, { loanPolicy: "REFERENCE_ONLY" });
    await insertCopy(db, editionId, { status: "ON_LOAN" });
    await insertCopy(db, editionId, { status: "LOST" });

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT total_copies, available_copies, reference_copies, on_loan_copies, fn_available_copies(?) AS fn
         FROM v_book_availability WHERE book_id = ?`,
      [bookId, bookId],
    );
    expect(rows[0]).toMatchObject({
      available_copies: "2",
      reference_copies: "1",
      on_loan_copies: "1",
      fn: 2,
    });
    expect(Number(rows[0]?.total_copies)).toBe(4);
  });

  it("hides withdrawn books from the public catalogue", async () => {
    const { bookId } = await insertStockedBook(db, 1);
    const visible = async () => {
      const [rows] = await db.query<RowDataPacket[]>(
        "SELECT 1 FROM v_catalog_public WHERE book_id = ?",
        [bookId],
      );
      return rows.length;
    };
    expect(await visible()).toBe(1);
    await db.query("UPDATE books SET status = 'WITHDRAWN' WHERE book_id = ?", [bookId]);
    expect(await visible()).toBe(0);
  });

  it("finds chapters through the full-text index", async () => {
    const editionId = await insertEdition(db, await insertBook(db, await insertCategory(db)));
    await db.query(
      `INSERT INTO chapters (edition_id, chapter_no, title, page_start, page_end, summary)
       VALUES (?, 1, 'Relational Database Design', 1, 40,
               'Functional dependencies, decomposition and the normal forms that remove redundancy.')`,
      [editionId],
    );
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT chapter_id FROM chapters WHERE MATCH (title, summary) AGAINST ('normal forms' IN NATURAL LANGUAGE MODE) AND edition_id = ?",
      [editionId],
    );
    expect(rows).toHaveLength(1);
  });

  it("builds valid test isbns", () => {
    expect(isbn13("978007802215")).toBe("9780078022159");
  });
});
