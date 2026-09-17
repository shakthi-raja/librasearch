import "server-only";
import { keywordSearch } from "./keyword";
import { type SearchFilters, type SearchHit, semanticSearch } from "./semantic";

export type HybridHit = SearchHit & {
  sources: { semantic?: number; keyword?: number };
};

const RRF_K = 60;

/**
 * Reciprocal rank fusion. Each source contributes 1 / (60 + rank); a chapter
 * that both sources like rises, and the sources stay visible per result.
 */
export function fuseRanks(semantic: SearchHit[], keyword: SearchHit[], limit = 10): HybridHit[] {
  const merged = new Map<number, HybridHit>();

  semantic.forEach((hit, index) => {
    const rank = index + 1;
    merged.set(hit.chapterId, {
      ...hit,
      sources: { semantic: rank },
      score: 1 / (RRF_K + rank),
    });
  });

  keyword.forEach((hit, index) => {
    const rank = index + 1;
    const existing = merged.get(hit.chapterId);
    if (existing) {
      existing.sources.keyword = rank;
      existing.score += 1 / (RRF_K + rank);
    } else {
      merged.set(hit.chapterId, {
        ...hit,
        sources: { keyword: rank },
        score: 1 / (RRF_K + rank),
      });
    }
  });

  return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function hybridSearch(
  query: string,
  filters: SearchFilters = {},
  limit = 10,
): Promise<{ hits: HybridHit[]; semanticDown: boolean }> {
  const [semantic, keyword] = await Promise.allSettled([
    semanticSearch(query, filters, 20),
    keywordSearch(query, filters, 20),
  ]);

  if (keyword.status === "rejected") throw keyword.reason;

  return {
    hits: fuseRanks(semantic.status === "fulfilled" ? semantic.value : [], keyword.value, limit),
    semanticDown: semantic.status === "rejected",
  };
}
