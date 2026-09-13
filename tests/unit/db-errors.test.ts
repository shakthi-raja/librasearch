import { describe, expect, it } from "vitest";
import { mapDbError } from "@/server/db/errors";

const mysql = (errno: number, sqlMessage: string) =>
  Object.assign(new Error(sqlMessage), { errno, sqlMessage });

describe("mapDbError", () => {
  it("translates signalled rule codes", () => {
    const e = mapDbError(
      mysql(1644, "LS202: previous edition must be an earlier edition of the same book"),
    );
    expect(e).toMatchObject({ code: "CONFLICT", status: 409 });
    expect(e.message).toMatch(/earlier edition/);
  });

  it("turns circulation signals into desk language", () => {
    const e = mapDbError(mysql(1644, "LS005: this member has reached the loan limit"));
    expect(e).toMatchObject({ code: "CONFLICT", status: 409 });
    expect(e.message).toBe("This member has reached the loan limit.");
  });

  it("names the duplicate key in words", () => {
    expect(
      mapDbError(mysql(1062, "Duplicate entry '978' for key 'editions.uq_editions_isbn'")).message,
    ).toMatch(/ISBN/);
  });

  it("explains a failed check", () => {
    const e = mapDbError(mysql(3819, "Check constraint 'ck_editions_isbn_checksum' is violated."));
    expect(e).toMatchObject({ code: "VALIDATION", status: 422 });
  });

  it("maps a missing grant to forbidden and hides anything unknown", () => {
    expect(mapDbError(mysql(1142, "UPDATE command denied")).code).toBe("FORBIDDEN");
    expect(mapDbError(new Error("socket hang up")).message).toBe("Something went wrong");
  });
});
