import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { BOOKS, type BookSeed, CATEGORIES, type EditionSeed, PUBLISHERS } from "./catalogue-data";
import { SYLLABUS_BOOKS, SYLLABUS_CATEGORIES, SYLLABUS_PUBLISHERS } from "./syllabus-books";
import { ELECTIVE_BOOKS } from "./syllabus-electives";

const ALL_BOOKS = [...BOOKS, ...SYLLABUS_BOOKS, ...ELECTIVE_BOOKS];

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Pages are not published per chapter, so spread the edition evenly over its chapters. */
export function estimatePages(edition: EditionSeed, chapterNo: number) {
  const per = edition.pages / edition.totalChapters;
  const start = Math.floor((chapterNo - 1) * per) + 1;
  const end = Math.max(start, Math.floor(chapterNo * per));
  return { start, end: Math.min(end, edition.pages) };
}

/**
 * Open Library's cover for the latest edition. default=false makes a missing
 * cover a 404, which the page turns into a drawn spine instead of a blank.
 */
export function coverUrl(book: BookSeed) {
  const latest = [...book.editions].sort((a, b) => b.editionNo - a.editionNo)[0];
  return latest
    ? `https://covers.openlibrary.org/b/isbn/${latest.isbn13}-M.jpg?default=false`
    : null;
}

async function idBy(db: Connection, sql: string, params: unknown[]) {
  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  const id = rows[0]?.id;
  return typeof id === "number" ? id : undefined;
}

async function seedPublishers(db: Connection) {
  for (const p of [...PUBLISHERS, ...SYLLABUS_PUBLISHERS]) {
    await db.query(
      `INSERT INTO publishers (name, city, website) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE city = VALUES(city), website = VALUES(website)`,
      [p.name, p.city, p.website ?? null],
    );
  }
}

async function seedCategories(db: Connection) {
  for (const c of [...CATEGORIES, ...SYLLABUS_CATEGORIES]) {
    const parentId = c.parent
      ? await idBy(db, "SELECT category_id AS id FROM categories WHERE slug = ?", [c.parent])
      : null;
    await db.query(
      `INSERT INTO categories (parent_id, name, slug, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id)`,
      [parentId ?? null, c.name, c.slug, c.description ?? null],
    );
  }
}

async function authorId(db: Connection, name: string) {
  const existing = await idBy(
    db,
    "SELECT author_id AS id FROM authors WHERE full_name = ? ORDER BY author_id LIMIT 1",
    [name],
  );
  if (existing) return existing;
  const [r] = await db.query<ResultSetHeader>("INSERT INTO authors (full_name) VALUES (?)", [name]);
  return r.insertId;
}

async function seedBook(db: Connection, book: BookSeed) {
  const categoryId = await idBy(db, "SELECT category_id AS id FROM categories WHERE slug = ?", [
    book.category,
  ]);
  if (!categoryId) throw new Error(`${book.title}: unknown category ${book.category}`);

  // a book is found again through any of its editions' isbns
  const isbns = book.editions.map((e) => e.isbn13);
  let bookId = await idBy(
    db,
    `SELECT book_id AS id FROM editions WHERE isbn13 IN (${isbns.map(() => "?").join(", ")}) LIMIT 1`,
    isbns,
  );
  const cover = coverUrl(book);
  if (bookId) {
    await db.query(
      "UPDATE books SET category_id = ?, title = ?, subtitle = ?, description = ?, cover_url = ? WHERE book_id = ?",
      [categoryId, book.title, book.subtitle ?? null, book.description, cover, bookId],
    );
  } else {
    const [r] = await db.query<ResultSetHeader>(
      "INSERT INTO books (category_id, title, subtitle, description, cover_url) VALUES (?, ?, ?, ?, ?)",
      [categoryId, book.title, book.subtitle ?? null, book.description, cover],
    );
    bookId = r.insertId;
  }

  for (const [index, name] of book.authors.entries()) {
    await db.query(
      `INSERT INTO book_authors (book_id, author_id, author_order) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE author_order = VALUES(author_order)`,
      [bookId, await authorId(db, name), index + 1],
    );
  }

  for (const tag of book.tags ?? []) {
    await db.query(
      "INSERT INTO tags (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)",
      [tag.replace(/-/g, " "), slugify(tag)],
    );
    await db.query(
      "INSERT IGNORE INTO book_tags (book_id, tag_id) SELECT ?, tag_id FROM tags WHERE slug = ?",
      [bookId, slugify(tag)],
    );
  }

  let previousId: number | null = null;
  for (const edition of [...book.editions].sort((a, b) => a.editionNo - b.editionNo)) {
    const publisherId = await idBy(db, "SELECT publisher_id AS id FROM publishers WHERE name = ?", [
      edition.publisher,
    ]);
    await db.query(
      `INSERT INTO editions
         (book_id, isbn13, edition_no, publisher_id, pub_year, page_count, format, previous_edition_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE publisher_id = VALUES(publisher_id), pub_year = VALUES(pub_year),
         page_count = VALUES(page_count), format = VALUES(format), previous_edition_id = VALUES(previous_edition_id)`,
      [
        bookId,
        edition.isbn13,
        edition.editionNo,
        publisherId ?? null,
        edition.year,
        edition.pages,
        edition.format ?? "PAPERBACK",
        previousId,
      ],
    );
    const editionId = await idBy(db, "SELECT edition_id AS id FROM editions WHERE isbn13 = ?", [
      edition.isbn13,
    ]);
    if (!editionId) throw new Error(`${edition.isbn13}: edition missing after upsert`);

    for (const chapter of edition.chapters) {
      const pages = estimatePages(edition, chapter.no);
      await db.query(
        `INSERT INTO chapters (edition_id, chapter_no, title, page_start, page_end, summary)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), summary = VALUES(summary),
           page_start = VALUES(page_start), page_end = VALUES(page_end)`,
        [editionId, chapter.no, chapter.title, pages.start, pages.end, chapter.summary],
      );
    }
    previousId = editionId;
  }
}

export type CatalogueCounts = { books: number; editions: number; chapters: number };

/** Loads the curated catalogue. Safe to run repeatedly: every write is an upsert. */
export async function seedCatalogue(db: Connection): Promise<CatalogueCounts> {
  await seedPublishers(db);
  await seedCategories(db);
  for (const book of ALL_BOOKS) await seedBook(db, book);
  return {
    books: ALL_BOOKS.length,
    editions: ALL_BOOKS.reduce((n, b) => n + b.editions.length, 0),
    chapters: ALL_BOOKS.reduce(
      (n, b) => n + b.editions.reduce((m, e) => m + e.chapters.length, 0),
      0,
    ),
  };
}
