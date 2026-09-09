import { describe, expect, it } from "vitest";
import { hrefWith, listParams, pageInfo } from "@/lib/url/list-params";

const sorts = ["title", "year"] as const;

describe("listParams", () => {
  it("reads page, size and sort", () => {
    expect(
      listParams(
        { page: "3", size: "50", sort: "year", dir: "desc" },
        { sorts, defaultSort: "title" },
      ),
    ).toEqual({
      page: 3,
      pageSize: 50,
      sort: "year",
      dir: "desc",
      offset: 100,
    });
  });

  it.each([
    [{ page: "-2" }, 1],
    [{ page: "abc" }, 1],
    [{ page: ["4", "9"] }, 4],
    [{}, 1],
  ])("falls back on a bad page %o", (params, page) => {
    expect(listParams(params, { sorts, defaultSort: "title" }).page).toBe(page);
  });

  it("caps the page size and ignores unknown sorts", () => {
    const p = listParams(
      { size: "5000", sort: "password", dir: "sideways" },
      { sorts, defaultSort: "title" },
    );
    expect(p.pageSize).toBe(20);
    expect(p.sort).toBe("title");
    expect(p.dir).toBe("asc");
  });
});

describe("hrefWith", () => {
  it("returns to page one when a filter changes", () => {
    expect(hrefWith("/catalog", { q: "sql", page: "4" }, { category: "databases" })).toBe(
      "/catalog?q=sql&category=databases",
    );
  });

  it("keeps the other filters when paging", () => {
    expect(hrefWith("/catalog", { q: "sql", page: "4" }, { page: 5 })).toBe(
      "/catalog?q=sql&page=5",
    );
  });

  it("drops empty values and page one", () => {
    expect(hrefWith("/catalog", { q: "sql" }, { q: null, page: 1 })).toBe("/catalog");
  });
});

describe("pageInfo", () => {
  it("describes the visible slice", () => {
    expect(pageInfo(3, 20, 45)).toEqual({
      page: 3,
      pageSize: 20,
      total: 45,
      pages: 3,
      from: 41,
      to: 45,
    });
  });

  it("handles an empty list", () => {
    expect(pageInfo(1, 20, 0)).toMatchObject({ pages: 1, from: 0, to: 0 });
  });
});
