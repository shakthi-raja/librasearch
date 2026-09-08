import "server-only";
import { queryTerms } from "@/lib/search/highlight";
import { pool } from "@/server/db/pool";
import { log } from "@/server/log";
import {
  type BookHit,
  type ChapterHit,
  keywordBooks,
  keywordChapters,
  logSearch,
} from "@/server/repositories/search";

function relevant<T extends { score: number }>(hits: T[], share: number): T[] {
  const top = hits[0]?.score ?? 0;
  return hits.filter((hit) => hit.score > 0 && hit.score >= top * share);
}

export type KeywordResult = { chapters: ChapterHit[]; books: BookHit[]; latencyMs: number };

/**
 * Keyword search over chapters and books. Every search is logged, signed in
 * or not, so zero-result queries can feed acquisition planning. Logging never
 * fails the search.
 */
export async function keywordSearch(query: string, userId: number | null): Promise<KeywordResult> {
  const db = pool("student");
  const started = performance.now();
  // InnoDB's default stopword list keeps words like "and", which would match
  // nearly every row; search on the meaningful terms only
  const matchText = queryTerms(query).join(" ") || query;
  const [chapterHits, bookHits] = await Promise.all([
    keywordChapters(db, matchText, 20),
    keywordBooks(db, matchText, 8),
  ]);
  // natural-language mode scores any shared word above zero; keep results
  // within reach of the best match so one common word does not pull in noise
  const chapters = relevant(chapterHits, 0.25);
  const books = relevant(bookHits, 0.4);
  const latencyMs = Math.round(performance.now() - started);

  await logSearch(db, {
    userId,
    query,
    mode: "KEYWORD",
    filters: {},
    resultCount: chapters.length + books.length,
    topScore: chapters[0]?.score ?? books[0]?.score ?? null,
    latencyMs,
  }).catch((error: unknown) => log.warn({ err: error }, "search log write failed"));

  return { chapters, books, latencyMs };
}
