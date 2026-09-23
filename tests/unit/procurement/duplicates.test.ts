import { describe, expect, it } from "vitest";
import {
  type CandidateBook,
  findDuplicates,
  titleSimilarity,
  titleTokens,
} from "@/lib/procurement/duplicates";

const book = (overrides: Partial<CandidateBook>): CandidateBook => ({
  bookId: 1,
  title: "Database System Concepts",
  authors: "Abraham Silberschatz, Henry Korth",
  isbn13: "9780078022159",
  year: 2019,
  ...overrides,
});

describe("titleTokens", () => {
  it("drops stopwords, punctuation and very short words", () => {
    expect([...titleTokens("The Design of an Operating System")]).toEqual([
      "design",
      "operating",
      "system",
    ]);
  });
});

describe("titleSimilarity", () => {
  it("scores an identical title at one", () => {
    expect(titleSimilarity("Computer Networks", "Computer Networks")).toBe(1);
  });

  it("scores unrelated titles at zero", () => {
    expect(titleSimilarity("Computer Networks", "Organic Chemistry")).toBe(0);
  });

  it("ignores words that carry no signal", () => {
    expect(titleSimilarity("The Design", "Design")).toBe(1);
  });
});

describe("findDuplicates", () => {
  it("treats a matching ISBN as decisive", () => {
    const found = findDuplicates({ title: "Some other title", isbn13: "9780078022159" }, [
      book({}),
    ]);
    expect(found).toEqual([expect.objectContaining({ score: 1, reason: "same-isbn" })]);
  });

  it("flags a close title with the same author", () => {
    const found = findDuplicates({ title: "Database System Concept", author: "Korth" }, [book({})]);
    expect(found[0]).toMatchObject({ reason: "same-author" });
    expect(found[0]?.score).toBeGreaterThanOrEqual(0.45);
  });

  it("flags a close title even when the author differs", () => {
    const found = findDuplicates({ title: "Database System Concepts", author: "Elmasri" }, [
      book({}),
    ]);
    expect(found[0]).toMatchObject({ reason: "similar-title" });
  });

  it("leaves unrelated and barely related titles alone", () => {
    const found = findDuplicates({ title: "Organic Chemistry", author: "Clayden" }, [book({})]);
    expect(found).toEqual([]);
  });

  it("returns the closest few, strongest first", () => {
    const found = findDuplicates({ title: "Database System Concepts" }, [
      book({ bookId: 1, title: "Database Systems" }),
      book({ bookId: 2, title: "Database System Concepts", isbn13: null }),
      book({ bookId: 3, title: "Database System Concepts, 7th Edition", isbn13: null }),
    ]);
    expect(found.map((candidate) => candidate.bookId).slice(0, 2)).toContain(2);
    expect(found[0]?.score).toBe(1);
    expect(found.length).toBeLessThanOrEqual(3);
  });
});
