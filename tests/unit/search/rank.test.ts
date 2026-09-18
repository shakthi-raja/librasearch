import { describe, expect, it } from "vitest";
import { fuseRanks } from "@/server/search/hybrid";
import { relevanceScore, type SearchHit } from "@/server/search/semantic";

const hit = (chapterId: number): SearchHit => ({
  chapterId,
  bookId: 1,
  bookTitle: "Book",
  authors: "Author",
  chapterNo: chapterId,
  chapterTitle: `Chapter ${chapterId}`,
  summary: "summary",
  editionNo: 1,
  pubYear: 2024,
  categoryPath: "Databases",
  available: 1,
  rack: "CS-04",
  shelf: "S1",
  similarity: 0.5,
  score: 0,
});

describe("rank fusion", () => {
  it("puts a chapter both sources agree on above either source alone", () => {
    const fused = fuseRanks([hit(1), hit(2)], [hit(2), hit(3)]);

    expect(fused.map((row) => row.chapterId)).toEqual([2, 1, 3]);
    expect(fused[0]?.sources).toEqual({ semantic: 2, keyword: 1 });
    expect(fused[0]?.score).toBeCloseTo(1 / 61 + 1 / 62, 6);
    expect(fused[1]?.sources).toEqual({ semantic: 1 });
    expect(fused[2]?.sources).toEqual({ keyword: 2 });
  });

  it("respects the requested limit and has no duplicates", () => {
    const fused = fuseRanks([hit(1), hit(2)], [hit(2), hit(3)], 2);
    expect(fused).toHaveLength(2);
    expect(new Set(fused.map((row) => row.chapterId)).size).toBe(2);
  });
});

describe("availability re-ranking", () => {
  it("lets an available copy outrank a stronger unavailable match", () => {
    expect(relevanceScore(0.7, 1)).toBeCloseTo(0.76, 6);
    expect(relevanceScore(0.9, 0)).toBeCloseTo(0.72, 6);
    expect(relevanceScore(0.7, 1)).toBeGreaterThan(relevanceScore(0.9, 0));
  });
});
