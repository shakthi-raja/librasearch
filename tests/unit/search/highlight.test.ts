import { describe, expect, it } from "vitest";
import { highlight, queryTerms } from "@/lib/search/highlight";

describe("queryTerms", () => {
  it("keeps meaningful words only", () => {
    expect(queryTerms("How do databases avoid duplicate data?")).toEqual([
      "databases",
      "avoid",
      "duplicate",
      "data",
    ]);
  });

  it("folds accents and case", () => {
    expect(queryTerms("Schütze RÉSUMÉ")).toEqual(["schutze", "resume"]);
  });
});

describe("highlight", () => {
  it("marks words that start with a term", () => {
    const segments = highlight("Functional dependencies and normalisation into normal forms.", [
      "normal",
    ]);
    expect(segments.filter((s) => s.hit).map((s) => s.text)).toEqual(["normalisation", "normal"]);
    expect(segments.map((s) => s.text).join("")).toBe(
      "Functional dependencies and normalisation into normal forms.",
    );
  });

  it("is case-insensitive and treats terms as text, not patterns", () => {
    expect(
      highlight("C++ and SQL", ["sql", "c++"])
        .filter((s) => s.hit)
        .map((s) => s.text),
    ).toEqual(["C++", "SQL"]);
  });

  it("opens a window around the first match in long text", () => {
    const text = `${"filler ".repeat(60)}the B+ tree index ${"tail ".repeat(60)}`;
    const joined = highlight(text, ["tree"], 120)
      .map((s) => s.text)
      .join("");
    expect(joined.startsWith("…")).toBe(true);
    expect(joined).toContain("tree");
    expect(joined.length).toBeLessThanOrEqual(124);
  });

  it("returns plain text when nothing matches", () => {
    expect(highlight("Hash tables", ["graph"])).toEqual([{ text: "Hash tables", hit: false }]);
  });
});
