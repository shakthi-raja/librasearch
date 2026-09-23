import { describe, expect, it } from "vitest";
import { allTermsQuery, phraseQuery } from "@/lib/search/fulltext";

describe("allTermsQuery", () => {
  it("requires every meaningful word as a prefix", () => {
    expect(allTermsQuery("normal forms")).toBe("+normal* +forms*");
    expect(allTermsQuery("Binary Search Tree")).toBe("+binary* +search* +tree*");
  });

  it("drops stopwords and words InnoDB does not index", () => {
    expect(allTermsQuery("the theory of computation")).toBe("+theory* +computation*");
    expect(allTermsQuery("os in a nutshell")).toBeNull();
  });

  it("strips boolean operators a user might type", () => {
    expect(allTermsQuery('-deadlock +"prevention"')).toBe("+deadlock* +prevention*");
    expect(allTermsQuery("c++ templates")).toBeNull();
  });

  it("returns null for a single word", () => {
    expect(allTermsQuery("normalisation")).toBeNull();
  });
});

describe("phraseQuery", () => {
  it("quotes the meaningful words in order", () => {
    expect(phraseQuery("Computer networks")).toBe('"computer networks"');
  });

  it("returns null for a single word", () => {
    expect(phraseQuery("deadlock")).toBeNull();
  });
});
