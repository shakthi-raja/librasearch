import "server-only";
import { pool } from "@/server/db/pool";
import { log } from "@/server/log";
import { logSearch } from "@/server/repositories/search-log";
import { type HybridHit, hybridSearch } from "./hybrid";
import { keywordSearch } from "./keyword";
import { type SearchFilters, type SearchHit, semanticSearch } from "./semantic";

export type { SearchFilters, SearchHit } from "./semantic";

export type SearchMode = "hybrid" | "semantic" | "keyword";

export type SearchResult = {
  mode: SearchMode;
  semanticDown: boolean;
  hits: (SearchHit & { sources?: HybridHit["sources"] })[];
};

/**
 * Runs the chosen mode and records it in search_log, signed in or not, so
 * zero-result queries can feed acquisition planning. Logging never fails the
 * search.
 */
export async function runSearch(
  query: string,
  mode: SearchMode,
  filters: SearchFilters = {},
  userId: number | null = null,
): Promise<SearchResult> {
  const started = performance.now();
  const result = await search(query, mode, filters);
  await logSearch(pool("student"), {
    userId,
    query,
    mode: result.semanticDown ? "KEYWORD" : (mode.toUpperCase() as Uppercase<SearchMode>),
    filters,
    resultCount: result.hits.length,
    topScore: result.hits[0]?.score ?? null,
    latencyMs: Math.round(performance.now() - started),
  }).catch((error: unknown) => log.warn({ err: error }, "search log write failed"));
  return result;
}

/** A semantic failure falls back to keywords. */
async function search(
  query: string,
  mode: SearchMode,
  filters: SearchFilters,
): Promise<SearchResult> {
  if (mode === "keyword") {
    return { mode, semanticDown: false, hits: await keywordSearch(query, filters) };
  }

  if (mode === "semantic") {
    try {
      return { mode, semanticDown: false, hits: await semanticSearch(query, filters) };
    } catch {
      return { mode, semanticDown: true, hits: await keywordSearch(query, filters) };
    }
  }

  const { hits, semanticDown } = await hybridSearch(query, filters);
  return { mode, semanticDown, hits };
}
