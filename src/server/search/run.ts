import "server-only";
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

/** Runs the chosen mode; a semantic failure falls back to keywords. */
export async function runSearch(
  query: string,
  mode: SearchMode,
  filters: SearchFilters = {},
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
