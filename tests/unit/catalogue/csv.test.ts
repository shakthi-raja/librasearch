import { describe, expect, it } from "vitest";
import {
  type CategoryRef,
  importable,
  isValidIsbn13,
  parseCsv,
  previewCsv,
} from "@/lib/catalogue/csv";

const CATEGORIES: CategoryRef[] = [
  { id: 7, name: "Databases", slug: "databases" },
  { id: 9, name: "Networks", slug: "networks" },
];

const VALID_ISBN = "9780078022159";

const csv = (...lines: string[]) => lines.join("\n");

describe("isValidIsbn13", () => {
  it("accepts a checksum-valid ISBN and rejects a mistyped one", () => {
    expect(isValidIsbn13(VALID_ISBN)).toBe(true);
    expect(isValidIsbn13("9780078022158")).toBe(false);
    expect(isValidIsbn13("123")).toBe(false);
  });
});

describe("parseCsv", () => {
  it("reads a BOM, quoted commas and blank lines", () => {
    const parsed = parseCsv(
      csv(
        "\uFEFFtitle,authors,isbn13,category",
        '"Database Systems, 7th",Silberschatz,9780078022159,databases',
        "",
        "Networks,Tanenbaum,9780132126953,networks",
      ),
    );
    expect(parsed.header).toEqual(["title", "authors", "isbn13", "category"]);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]?.cells[0]).toBe("Database Systems, 7th");
  });
});

describe("previewCsv", () => {
  it("marks a clean row ready and resolves its category id", () => {
    const preview = previewCsv(
      csv("title,authors,isbn13,category", `Database Systems,Silberschatz,${VALID_ISBN},databases`),
      CATEGORIES,
    );
    expect(preview.valid).toBe(1);
    expect(preview.invalid).toBe(0);
    expect(preview.rows[0]?.categoryId).toBe(7);
    expect(importable(preview)[0]).toMatchObject({ title: "Database Systems", copies: 1 });
  });

  it("reports each problem without stopping the other rows", () => {
    const preview = previewCsv(
      csv(
        "title,authors,isbn13,category",
        `Good,Author,${VALID_ISBN},databases`,
        `Bad isbn,Author,9780078022158,databases`,
        `No category,Author,9780132126953,poetry`,
        `Twice,Author,${VALID_ISBN},databases`,
      ),
      CATEGORIES,
    );
    expect(preview.valid).toBe(1);
    expect(preview.invalid).toBe(3);
    expect(preview.rows[1]?.issues.join(" ")).toMatch(/isbn-13 is not valid/i);
    expect(preview.rows[2]?.issues.join(" ")).toMatch(/unknown category/i);
    expect(preview.rows[3]?.issues.join(" ")).toMatch(/already in the catalogue|twice/i);
  });

  it("flags an ISBN already held by the catalogue", () => {
    const preview = previewCsv(
      csv("title,authors,isbn13,category", `Owned,Author,${VALID_ISBN},databases`),
      CATEGORIES,
      new Set([VALID_ISBN]),
    );
    expect(preview.rows[0]?.issues.join(" ")).toMatch(/already in the catalogue/i);
    expect(importable(preview)).toHaveLength(0);
  });

  it("refuses a file without the required columns", () => {
    const preview = previewCsv(csv("title,author", "A,B"), CATEGORIES);
    expect(preview.error).toMatch(/missing column/i);
  });

  it("checks quantity and year ranges", () => {
    const preview = previewCsv(
      csv(
        "title,authors,isbn13,category,copies,year",
        `Too many,Author,${VALID_ISBN},databases,25,2020`,
      ),
      CATEGORIES,
    );
    expect(preview.rows[0]?.issues.join(" ")).toMatch(/copies/i);
  });
});
