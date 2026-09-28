import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { forgetAliases } from "@/server/search/aliases";
import { runSearch } from "@/server/search/run";
import { insertBook, insertCategory, insertEdition } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertDepartment } from "../support/fixtures";
import { ER, expectSqlError } from "../support/sql-errors";

let db: Connection;

const letters = (n: number) =>
  Array.from({ length: n }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join(
    "",
  );

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

describe("search_aliases", () => {
  it("accepts lowercase words and slash or plus forms only", async () => {
    await db.query("INSERT INTO search_aliases (alias, expansion) VALUES (?, 'something longer')", [
      `x${letters(5)}/y`,
    ]);
    await expectSqlError(
      db.query("INSERT INTO search_aliases (alias, expansion) VALUES ('Upper', 'something')"),
      ER.CHECK_CONSTRAINT_VIOLATED,
    );
    await expectSqlError(
      db.query("INSERT INTO search_aliases (alias, expansion) VALUES ('two words', 'something')"),
      ER.CHECK_CONSTRAINT_VIOLATED,
    );
  });

  it("refuses an alias that expands to itself", async () => {
    const alias = letters(6);
    await expectSqlError(
      db.query("INSERT INTO search_aliases (alias, expansion) VALUES (?, ?)", [
        alias,
        ` ${alias} `,
      ]),
      ER.CHECK_CONSTRAINT_VIOLATED,
    );
  });

  it("audits every change", async () => {
    const alias = letters(7);
    await db.query("INSERT INTO search_aliases (alias, expansion) VALUES (?, 'first meaning')", [
      alias,
    ]);
    await db.query("UPDATE search_aliases SET expansion = 'second meaning' WHERE alias = ?", [
      alias,
    ]);
    await db.query("DELETE FROM search_aliases WHERE alias = ?", [alias]);
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT action FROM audit_log WHERE table_name = 'search_aliases' AND record_id = ? ORDER BY audit_id",
      [alias],
    );
    expect(rows.map((row) => row.action)).toEqual(["INSERT", "UPDATE", "DELETE"]);
  });
});

describe("runSearch with aliases and course codes", () => {
  it("searches for what an alias stands for", async () => {
    const alias = letters(6);
    await db.query(
      "INSERT INTO search_aliases (alias, expansion) VALUES (?, 'computer networks')",
      [alias],
    );
    await forgetAliases();

    const result = await runSearch(alias, "keyword");
    expect(result.understood).toMatchObject({
      text: "computer networks",
      expansions: [{ alias, expansion: "computer networks" }],
    });
  });

  it("turns a course code into that course and searches its title", async () => {
    const code = `UE24CS3${String(Date.now() % 100_000).padStart(5, "0")}X`;
    await db.query(
      "INSERT INTO courses (course_code, title, dept_id, semester, credits) VALUES (?, 'Quarnelology', ?, 5, 4)",
      [code, await insertDepartment(db)],
    );
    const book = await insertBook(db, await insertCategory(db));
    await insertEdition(db, book);
    await db.query(
      `INSERT INTO course_books (course_id, book_id, role, position)
       SELECT course_id, ?, 'TEXTBOOK', 1 FROM courses WHERE course_code = ?`,
      [book, code],
    );

    const result = await runSearch(code.toLowerCase(), "keyword");
    expect(result.course).toMatchObject({ code, title: "Quarnelology" });
    expect(result.course?.books.map((b) => b.bookId)).toEqual([book]);
    expect(result.understood.text).toBe("Quarnelology");
  });
});
