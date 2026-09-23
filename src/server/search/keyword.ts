import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { allTermsQuery, phraseQuery } from "@/lib/search/fulltext";
import { pool } from "@/server/db/pool";
import { categorySubtreeIds, type SearchFilters, type SearchHit } from "./semantic";

/**
 * The keyword half of hybrid search. MySQL FULLTEXT ranks the same chapter
 * rows the vector side returns, so the two ranks can be fused directly.
 *
 * Chapters that contain every word of the query come first, the exact phrase
 * ahead of the rest. When at least one chapter has every word, chapters that
 * share only some of them are dropped: they are the noise of natural-language
 * mode, not partial answers.
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

  const allTerms = allTermsQuery(query);
  const phrase = phraseQuery(query);
  const conditions = ["b.status = 'ACTIVE'"];
  const params: unknown[] = [query];
  if (allTerms) params.push(allTerms);
  if (phrase) params.push(phrase);
  params.push(query);

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
            MATCH(c.title, c.summary) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance,
            ${allTerms ? "MATCH(c.title, c.summary) AGAINST(? IN BOOLEAN MODE) > 0" : "0"} AS has_all,
            ${phrase ? "MATCH(c.title, c.summary) AGAINST(? IN BOOLEAN MODE) > 0" : "0"} AS has_phrase
       FROM chapters c
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
       LEFT JOIN v_category_tree t ON t.category_id = b.category_id
      WHERE MATCH(c.title, c.summary) AGAINST(? IN NATURAL LANGUAGE MODE)
        AND ${conditions.join(" AND ")}
      ORDER BY has_all DESC, has_phrase DESC, relevance DESC, c.chapter_id
      LIMIT ?`,
    params,
  );

  const complete = rows.some((row) => Number(row.has_all) === 1);
  const kept = complete ? rows.filter((row) => Number(row.has_all) === 1) : rows;

  return kept.map((row) => {
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
