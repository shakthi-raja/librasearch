import type { Connection, ResultSetHeader } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { keywordSearch } from "@/server/search/keyword";
import { insertBook, insertCategory, insertEdition } from "../support/catalogue";
import { adminConnection } from "../support/db";

// Made-up words, fresh on every run, keep these chapters apart from anything
// else in the database, including rows an earlier run left behind.
const word = (prefix: string) =>
  prefix +
  Array.from({ length: 6 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join(
    "",
  );
const A = word("qa");
const B = word("vx");

const CHAPTERS = [
  [`${A} ${B} in Practice`, `How ${A} ${B} behaves when the tables grow large and busy.`],
  [`${B} Systems`, `Systems that are ${B}, and a short note on the ${A} they share.`],
  [`${A} Energy`, `Energy, heat and work, with one ${A} worked out from first principles.`],
] as const;

let db: Connection;
const ids: number[] = [];

beforeAll(async () => {
  db = await adminConnection();
  const editionId = await insertEdition(db, await insertBook(db, await insertCategory(db)));
  for (const [i, [title, summary]] of CHAPTERS.entries()) {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO chapters (edition_id, chapter_no, title, page_start, page_end, summary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [editionId, i + 1, title, i * 20 + 1, i * 20 + 19, summary],
    );
    ids.push(result.insertId);
  }
});

afterAll(async () => {
  await db.end();
});

describe("keywordSearch", () => {
  it("returns only chapters with every word, the exact phrase first", async () => {
    const hits = await keywordSearch(`${A} ${B}`);
    expect(hits.map((hit) => hit.chapterId)).toEqual([ids[0], ids[1]]);
  });

  it("falls back to any shared word when no chapter has them all", async () => {
    const hits = await keywordSearch(`${A} ${word("zz")}`);
    expect(hits.map((hit) => hit.chapterId).sort()).toEqual([...ids].sort());
  });

  it("ranks a single word by full-text relevance alone", async () => {
    const hits = await keywordSearch(A);
    expect(new Set(hits.map((hit) => hit.chapterId))).toEqual(new Set(ids));
  });
});
