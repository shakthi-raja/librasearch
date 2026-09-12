import { describe, expect, it } from "vitest";
import { issueSchema, returnSchema } from "@/lib/validation/circulation";

describe("issueSchema", () => {
  it("accepts a university id and upper-cases a scanned barcode", () => {
    const parsed = issueSchema.parse({ member: " PES1UG24CS001 ", barcode: "ls26000003" });
    expect(parsed).toEqual({ member: "PES1UG24CS001", barcode: "LS26000003" });
  });

  it("accepts an email", () => {
    expect(
      issueSchema.safeParse({ member: "student@librasearch.local", barcode: "LS26000003" }).success,
    ).toBe(true);
  });

  it("rejects a barcode that is not LS plus eight digits", () => {
    const parsed = issueSchema.safeParse({ member: "PES1UG24CS001", barcode: "12345" });
    expect(parsed.success).toBe(false);
  });

  it("rejects a missing member", () => {
    expect(issueSchema.safeParse({ member: "", barcode: "LS26000003" }).success).toBe(false);
  });
});

describe("returnSchema", () => {
  it("only needs a barcode", () => {
    expect(returnSchema.parse({ barcode: "LS26000003" })).toEqual({ barcode: "LS26000003" });
  });
});
