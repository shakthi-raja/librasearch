import "server-only";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";
import { embedQuery } from "@/server/vector/embedding";
import { qdrant } from "@/server/vector/qdrant";

export type SearchFilters = {
  categorySlug?: string;
  language?: string;
  yearFrom?: number;
  yearTo?: number;
};

export type SearchHit = {
  chapterId: number;
  bookId: number;
  bookTitle: string;
  authors: string;
  chapterNo: number;
  chapterTitle: string;
  summary: string;
  editionNo: number;
  pubYear: number;
  categoryPath: string;
  available: number;
  rack: string | null;
  shelf: string | null;
  similarity: number;
  score: number;
};

export async function categorySubtreeIds(db: Pool, slug: string) {
  const [rows] = await db.query<RowDataPacket[]>(
    `WITH RECURSIVE subtree AS (
       SELECT category_id FROM categories WHERE slug = ?
       UNION ALL
       SELECT c.category_id
         FROM categories c
         JOIN subtree s ON c.parent_id = s.category_id
     )
     SELECT category_id FROM subtree`,
    [slug],
  );
  return rows.map((row) => Number(row.category_id));
}

function buildFilter(categoryIds: number[] | undefined, filters: SearchFilters) {
  const must: Record<string, unknown>[] = [];
  if (categoryIds) {
    must.push({ key: "category_id", match: { any: categoryIds } });
  }
  if (filters.language) {
    must.push({ key: "language", match: { value: filters.language } });
  }
  if (filters.yearFrom !== undefined || filters.yearTo !== undefined) {
    must.push({
      key: "pub_year",
      range: {
        ...(filters.yearFrom !== undefined ? { gte: filters.yearFrom } : {}),
        ...(filters.yearTo !== undefined ? { lte: filters.yearTo } : {}),
      },
    });
  }
  return must.length > 0 ? { must } : undefined;
}

async function hitsFor(db: Pool, chapterIds: number[]) {
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
                AND cp.loan_policy <> 'REFERENCE_ONLY') AS shelf
       FROM chapters c
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
       LEFT JOIN v_category_tree t ON t.category_id = b.category_id
      WHERE c.chapter_id IN (?) AND b.status = 'ACTIVE'`,
    [chapterIds],
  );
  return rows;
}

/** Similarity is the stronger signal, but a copy on the shelf breaks ties. */
export function relevanceScore(similarity: number, available: number) {
  return 0.8 * similarity + 0.2 * (available > 0 ? 1 : 0);
}

/**
 * Semantic chapter search. Qdrant proposes twenty neighbours above the floor;
 * MySQL supplies availability and the shelf, and the final order weights
 * similarity against whether a copy can be borrowed today.
 */
export async function semanticSearch(
  query: string,
  filters: SearchFilters = {},
  limit = 10,
): Promise<SearchHit[]> {
  const db = pool("student");
  const vector = await embedQuery(query);
  const categoryIds = filters.categorySlug
    ? await categorySubtreeIds(db, filters.categorySlug)
    : undefined;
  const filter = buildFilter(categoryIds, filters);

  const result = await qdrant().query("chapters", {
    query: vector,
    limit: 20,
    score_threshold: 0.4,
    with_payload: false,
    ...(filter ? { filter } : {}),
  });

  const similarityById = new Map(result.points.map((point) => [Number(point.id), point.score]));
  const chapterIds = [...similarityById.keys()];
  if (chapterIds.length === 0) return [];

  const rows = await hitsFor(db, chapterIds);
  return rows
    .map((row) => {
      const similarity = similarityById.get(Number(row.chapter_id)) ?? 0;
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
        similarity,
        score: relevanceScore(similarity, available),
      } satisfies SearchHit;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
