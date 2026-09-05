import { describe, expect, it } from "vitest";
import { splitSql } from "../../../scripts/lib/sql-split";

describe("splitSql", () => {
  it("splits on semicolons and drops empty statements", () => {
    expect(splitSql("SELECT 1;\n\nSELECT 2;;")).toEqual(["SELECT 1", "SELECT 2"]);
  });

  it("keeps delimiters inside quotes and backticks", () => {
    const sql = "INSERT INTO t VALUES ('a;b', \"c;d\");\nSELECT `x;y` FROM t;";
    expect(splitSql(sql)).toEqual(["INSERT INTO t VALUES ('a;b', \"c;d\")", "SELECT `x;y` FROM t"]);
  });

  it("handles doubled and escaped quotes", () => {
    expect(splitSql("SELECT 'it''s; fine', 'a\\'b;c';")).toEqual([
      "SELECT 'it''s; fine', 'a\\'b;c'",
    ]);
  });

  it("strips line and block comments", () => {
    const sql = "-- heading; not a statement\nSELECT 1; # trailing; comment\n/* a; b */ SELECT 2;";
    expect(splitSql(sql)).toEqual(["SELECT 1", "SELECT 2"]);
  });

  it("does not treat a double minus without a space as a comment", () => {
    expect(splitSql("SELECT 5--2;")).toEqual(["SELECT 5--2"]);
  });

  it("honours DELIMITER blocks for routines", () => {
    const sql = [
      "CREATE TABLE t (id INT);",
      "DELIMITER $$",
      "CREATE PROCEDURE p()",
      "BEGIN",
      "  SELECT 1;",
      "  SELECT 2;",
      "END$$",
      "DELIMITER ;",
      "CALL p();",
    ].join("\n");
    const statements = splitSql(sql);
    expect(statements).toHaveLength(3);
    expect(statements[1]).toMatch(
      /^CREATE PROCEDURE p\(\)\nBEGIN\n {2}SELECT 1;\n {2}SELECT 2;\nEND$/,
    );
    expect(statements[2]).toBe("CALL p()");
  });

  it("rejects unterminated quotes", () => {
    expect(() => splitSql("SELECT 'oops;")).toThrow(/unterminated/);
  });
});
