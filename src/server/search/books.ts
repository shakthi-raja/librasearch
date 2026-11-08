import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";
import { collection, qdrant } from "@/server/vector/qdrant";
import { cached, catalogueVersion, digest } from "./cache";
import { queryVector } from "./vectors";

export type BookMatch = {
  bookId: number;
  title: string;
  authors: string;
  latestYear: number | null;
  available: number;
  similarity: number;
  categoryPath: string;
};

/**
 * Whole books whose description is close to the query. Many syllabus books
 * have no chapter list in the catalogue; this is how search still finds them.
 */
export async function semanticBooks(query: string, limit = 10): Promise<BookMatch[]> {
  const version = await catalogueVersion();
  const key =
    version === null
      ? null
      : `search:neighbours:${version}:books:${digest([query.trim().toLowerCase(), limit])}`;
  const points = await cached(key, 3600, async () => {
    const result = await qdrant().query(collection("books"), {
      query: await queryVector(query),
      limit,
      score_threshold: 0.5,
      with_payload: false,
    });
    return result.points.map((point) => ({ id: Number(point.id), score: point.score }));
  });
  const similarity = new Map(points.map((point) => [point.id, point.score]));
  if (similarity.size === 0) return [];

  const [rows] = await pool("student").query<RowDataPacket[]>(
    `SELECT book_id, title, authors, latest_year, available_copies, category_path
       FROM v_catalog_public WHERE book_id IN (?)`,
    [[...similarity.keys()]],
  );
  return rows
    .map((row) => ({
      bookId: Number(row.book_id),
      title: String(row.title),
      authors: String(row.authors ?? ""),
      latestYear: row.latest_year === null ? null : Number(row.latest_year),
      available: Number(row.available_copies),
      similarity: similarity.get(Number(row.book_id)) ?? 0,
      categoryPath: String(row.category_path ?? ""),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}
