import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";
import { categorySubtreeIds, type SearchFilters, type SearchHit } from "./semantic";

/**
 * The keyword half of hybrid search. MySQL FULLTEXT ranks the same chapter
 * rows the vector side returns, so the two ranks can be fused directly.
 */
export async function keywordSearch(
  query: string,
  filters: SearchFilters = {},
  limit = 20,
): Promise<SearchHit[]> {
  const db = pool("student");
  const categoryIds = filters.categorySlug
    ? await categorySubtreeIds(db, filters.categorySlug)
    : null;

  const conditions = ["b.status = 'ACTIVE'"];
  const params: unknown[] = [query, query];

  if (categoryIds) {
    conditions.push(`b.category_id IN (${categoryIds.map(() => "?").join(",")})`);
    params.push(...categoryIds);
  }
  if (filters.language) {
    conditions.push("b.language = ?");
    params.push(filters.language);
  }
  if (filters.yearFrom !== undefined) {
    conditions.push("e.pub_year >= ?");
    params.push(filters.yearFrom);
  }
  if (filters.yearTo !== undefined) {
    conditions.push("e.pub_year <= ?");
    params.push(filters.yearTo);
  }
  params.push(limit);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT c.chapter_id, c.chapter_no, c.title AS chapter_title, c.summary,
            e.edition_no, e.pub_year, b.book_id, b.title AS book_title, b.category_id,
            (SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
               FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
              WHERE ba.book_id = b.book_id) AS authors,
            t.path AS category_path,
            (SELECT COUNT(*) FROM copies cp
              WHERE cp.edition_id = e.edition_id AND cp.status = 'AVAILABLE'
                AND cp.loan_policy <> 'REFERENCE_ONLY') AS available,
            (SELECT MIN(cp.rack_code) FROM copies cp
              WHERE cp.edition_id = e.edition_id AND cp.status = 'AVAILABLE'
                AND cp.loan_policy <> 'REFERENCE_ONLY') AS rack,
            (SELECT MIN(cp.shelf_code) FROM copies cp
              WHERE cp.edition_id = e.edition_id AND cp.status = 'AVAILABLE'
                AND cp.loan_policy <> 'REFERENCE_ONLY') AS shelf,
            MATCH(c.title, c.summary) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance
       FROM chapters c
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
       LEFT JOIN v_category_tree t ON t.category_id = b.category_id
      WHERE MATCH(c.title, c.summary) AGAINST(? IN NATURAL LANGUAGE MODE)
        AND ${conditions.join(" AND ")}
      ORDER BY relevance DESC, c.chapter_id
      LIMIT ?`,
    params,
  );

  return rows.map((row) => {
    const available = Number(row.available);
    return {
      chapterId: Number(row.chapter_id),
      bookId: Number(row.book_id),
      bookTitle: row.book_title,
      authors: row.authors ?? "",
      chapterNo: Number(row.chapter_no),
      chapterTitle: row.chapter_title,
      summary: row.summary,
      editionNo: Number(row.edition_no),
      pubYear: Number(row.pub_year),
      categoryPath: row.category_path ?? "",
      available,
      rack: row.rack ?? null,
      shelf: row.shelf ?? null,
      similarity: 0,
      score: Number(row.relevance),
    } satisfies SearchHit;
  });
}
