import { describe, expect, it } from "vitest";
import {
  EMPTY_CONTEXT,
  personalise,
  type ReaderContext,
  rankBooks,
} from "@/lib/search/personalise";

const hit = (chapterId: number, bookId: number, score: number) => ({ chapterId, bookId, score });

const context: ReaderContext = {
  chapters: new Map([[3, { courseCode: "UE24CS351A", unitNo: 3, unitTitle: "Normal forms" }]]),
  books: new Map([[20, ["UE24CS351A"]]]),
};

describe("personalise", () => {
  it("keeps the order and adds empty reasons without a reader", () => {
    const hits = [hit(1, 10, 0.9), hit(2, 10, 0.5)];
    expect(personalise(hits, EMPTY_CONTEXT).map((h) => h.chapterId)).toEqual([1, 2]);
    expect(personalise(hits, EMPTY_CONTEXT)[0]).toMatchObject({
      inSyllabus: null,
      prescribedFor: [],
    });
  });

  it("lifts a chapter approved for the reader's unit and says which", () => {
    const ranked = personalise([hit(1, 10, 0.8), hit(3, 30, 0.7)], context);
    expect(ranked.map((h) => h.chapterId)).toEqual([3, 1]);
    expect(ranked[0]?.inSyllabus).toEqual({
      courseCode: "UE24CS351A",
      unitNo: 3,
      unitTitle: "Normal forms",
    });
  });

  it("lifts a prescribed book less than an approved chapter", () => {
    const ranked = personalise([hit(4, 20, 0.7), hit(3, 30, 0.7)], context);
    expect(ranked.map((h) => h.chapterId)).toEqual([3, 4]);
    expect(ranked[1]?.prescribedFor).toEqual(["UE24CS351A"]);
  });

  it("does not let a boost overturn a much stronger match", () => {
    const ranked = personalise([hit(1, 10, 0.9), hit(3, 30, 0.5)], context);
    expect(ranked.map((h) => h.chapterId)).toEqual([1, 3]);
  });

  it("keeps equal scores in their original order", () => {
    const ranked = personalise([hit(5, 50, 0.4), hit(6, 60, 0.4)], EMPTY_CONTEXT);
    expect(ranked.map((h) => h.chapterId)).toEqual([5, 6]);
  });
});

describe("rankBooks", () => {
  const book = (bookId: number, similarity: number, categoryPath: string) => ({
    bookId,
    similarity,
    categoryPath,
  });

  it("prefers the subject the chapter results are about", () => {
    const ranked = rankBooks(
      [book(1, 0.64, "Management/Finance"), book(2, 0.6, "Computer science/Databases")],
      ["Computer science/Databases"],
      EMPTY_CONTEXT,
    );
    expect(ranked.map((b) => b.bookId)).toEqual([2, 1]);
  });

  it("drops weak matches and marks prescribed books", () => {
    const ranked = rankBooks(
      [book(20, 0.58, "Computer science/Databases"), book(9, 0.5, "Mathematics")],
      [],
      context,
    );
    expect(ranked).toEqual([
      {
        bookId: 20,
        similarity: 0.58,
        categoryPath: "Computer science/Databases",
        prescribedFor: ["UE24CS351A"],
      },
    ]);
  });

  it("keeps at most the limit", () => {
    const many = Array.from({ length: 8 }, (_, i) => book(i, 0.7, "x"));
    expect(rankBooks(many, [], EMPTY_CONTEXT, 4)).toHaveLength(4);
  });
});
