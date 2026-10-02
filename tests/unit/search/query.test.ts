import { describe, expect, it } from "vitest";
import { aliasKey, expandQuery, normaliseQuery } from "@/lib/search/query";

const aliases = new Map([
  ["cn", "computer networks"],
  ["dbms", "database management systems"],
  ["ui/ux", "user interface and user experience design"],
  ["c++", "c++ programming"],
]);

describe("normaliseQuery", () => {
  it("collapses whitespace and caps the length", () => {
    expect(normaliseQuery("  normal \n forms  ")).toBe("normal forms");
    expect(normaliseQuery("x".repeat(300))).toHaveLength(200);
  });
});

describe("aliasKey", () => {
  it("lower-cases and strips surrounding punctuation", () => {
    expect(aliasKey("DBMS,")).toBe("dbms");
    expect(aliasKey("(CN)")).toBe("cn");
    expect(aliasKey("C++")).toBe("c++");
  });
});

describe("expandQuery", () => {
  it("expands a lone abbreviation", () => {
    expect(expandQuery("cn", aliases)).toEqual({
      original: "cn",
      text: "computer networks",
      expansions: [{ alias: "cn", expansion: "computer networks" }],
      courseCode: null,
    });
  });

  it("expands inside a longer query and keeps the other words", () => {
    const understood = expandQuery("DBMS normal forms", aliases);
    expect(understood.text).toBe("database management systems normal forms");
    expect(understood.expansions).toHaveLength(1);
  });

  it("keeps slash and plus forms whole", () => {
    expect(expandQuery("ui/ux basics", aliases).text).toBe(
      "user interface and user experience design basics",
    );
    expect(expandQuery("c++", aliases).text).toBe("c++ programming");
  });

  it("leaves a query without aliases alone", () => {
    expect(expandQuery("binary search tree", aliases)).toMatchObject({
      text: "binary search tree",
      expansions: [],
    });
  });

  it("takes a quoted query literally", () => {
    expect(expandQuery('"cn"', aliases)).toMatchObject({ text: "cn", expansions: [] });
  });

  it("recognises a course code", () => {
    expect(expandQuery("ue24cs351a", aliases).courseCode).toBe("UE24CS351A");
    expect(expandQuery("UE24CS342BA10", aliases).courseCode).toBe("UE24CS342BA10");
    expect(expandQuery("UE24CS351A normal forms", aliases).courseCode).toBeNull();
  });
});
