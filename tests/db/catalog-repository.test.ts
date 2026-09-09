import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePools, pool } from "@/server/db/pool";
import { categoryTree, listBooks } from "@/server/repositories/catalog";
import { insertBook, insertCategory, insertCopy, insertEdition } from "../support/catalogue";
import { adminConnection } from "../support/db";

let db: Connection;
let rootSlug: string;
let stocked: number;
let empty: number;

beforeAll(async () => {
  db = await adminConnection();
  const root = await insertCategory(db);
  const child = await insertCategory(db, root);
  const grandchild = await insertCategory(db, child);
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT slug FROM categories WHERE category_id = ?",
    [root],
  );
  rootSlug = String(rows[0]?.slug);

  stocked = await insertBook(db, grandchild);
  await insertCopy(db, await insertEdition(db, stocked));
  empty = await insertBook(db, child);
  await insertEdition(db, empty);
});

afterAll(async () => {
  await closePools();
  await db.end();
});

const base = {
  availableOnly: false,
  sort: "title" as const,
  dir: "asc" as const,
  limit: 100,
  offset: 0,
};

describe("catalogue browsing as a guest", () => {
  it("includes books from every level below the chosen subject", async () => {
    const { rows, total } = await listBooks(pool("student"), { ...base, categorySlug: rootSlug });
    expect(rows.map((b) => b.bookId).sort()).toEqual([stocked, empty].sort());
    expect(total).toBe(2);
  });

  it("can keep only books with a copy on the shelf", async () => {
    const { rows } = await listBooks(pool("student"), {
      ...base,
      categorySlug: rootSlug,
      availableOnly: true,
    });
    expect(rows.map((b) => b.bookId)).toEqual([stocked]);
    expect(rows[0]).toMatchObject({ availableCopies: 1, totalCopies: 1, racks: ["CS-04"] });
  });

  it("counts books under each subject, including deeper ones", async () => {
    const tree = await categoryTree(pool("student"));
    expect(tree.find((n) => n.slug === rootSlug)?.bookCount).toBe(2);
  });

  it("pages and sorts without trusting the request for column names", async () => {
    const page = await listBooks(pool("student"), {
      ...base,
      categorySlug: rootSlug,
      limit: 1,
      sort: "available",
      dir: "desc",
    });
    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]?.bookId).toBe(stocked);
    expect(page.total).toBe(2);
  });
});
