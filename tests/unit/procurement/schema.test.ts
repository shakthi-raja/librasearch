import { describe, expect, it } from "vitest";
import { decisionSchema, purchaseRequestSchema } from "@/lib/validation/procurement";

const valid = {
  title: "Database System Concepts",
  author: "Silberschatz",
  isbn13: "978-0-07-802215-9",
  quantity: "2",
  reason: "Course text for the DBMS core.",
};

describe("purchaseRequestSchema", () => {
  it("accepts a well-formed request and normalises the ISBN", () => {
    const parsed = purchaseRequestSchema.parse(valid);
    expect(parsed.isbn13).toBe("9780078022159");
    expect(parsed.quantity).toBe(2);
  });

  it("turns blank optional fields into null", () => {
    const parsed = purchaseRequestSchema.parse({ ...valid, author: "", isbn13: "" });
    expect(parsed.author).toBeNull();
    expect(parsed.isbn13).toBe("");
  });

  it("rejects a short title, a bad ISBN and an impossible quantity", () => {
    expect(purchaseRequestSchema.safeParse({ ...valid, title: "A" }).success).toBe(false);
    expect(purchaseRequestSchema.safeParse({ ...valid, isbn13: "123" }).success).toBe(false);
    expect(purchaseRequestSchema.safeParse({ ...valid, quantity: "0" }).success).toBe(false);
    expect(purchaseRequestSchema.safeParse({ ...valid, quantity: "51" }).success).toBe(false);
  });

  it("rejects a reason that says nothing", () => {
    expect(purchaseRequestSchema.safeParse({ ...valid, reason: "x" }).success).toBe(false);
  });
});

describe("decisionSchema", () => {
  it("accepts both decisions", () => {
    expect(decisionSchema.safeParse({ requestId: "3", decision: "APPROVED" }).success).toBe(true);
    expect(decisionSchema.safeParse({ requestId: "3", decision: "REJECTED" }).success).toBe(true);
  });

  it("rejects an unknown decision and a missing request", () => {
    expect(decisionSchema.safeParse({ requestId: "3", decision: "ORDERED" }).success).toBe(false);
    expect(decisionSchema.safeParse({ requestId: "", decision: "APPROVED" }).success).toBe(false);
  });
});
