import { beforeEach, describe, expect, it } from "vitest";
import { idempotencyKey, resetIdempotency, withIdempotency } from "@/server/http/idempotency";

beforeEach(() => {
  resetIdempotency();
});

describe("withIdempotency", () => {
  it("runs the work once and returns the first result for a repeated key", async () => {
    let calls = 0;
    const work = async () => {
      calls += 1;
      return { loanId: 7, label: "first" };
    };

    const first = await withIdempotency("key-12345678", "issue", work);
    const second = await withIdempotency("key-12345678", "issue", work);

    expect(first).toEqual({ loanId: 7, label: "first" });
    expect(second).toEqual(first);
    expect(calls).toBe(1);
  });

  it("keeps scopes apart", async () => {
    let calls = 0;
    const work = async () => {
      calls += 1;
      return calls;
    };

    await withIdempotency("key-12345678", "issue", work);
    await withIdempotency("key-12345678", "return", work);

    expect(calls).toBe(2);
  });

  it("runs normally when there is no key", async () => {
    let calls = 0;
    const work = async () => {
      calls += 1;
      return calls;
    };

    expect(await withIdempotency(null, "issue", work)).toBe(1);
    expect(await withIdempotency(null, "issue", work)).toBe(2);
  });
});

describe("idempotencyKey", () => {
  it("accepts a scanner-safe token and rejects a short one", () => {
    expect(idempotencyKey("abc12345")).toBe("abc12345");
    expect(idempotencyKey(null)).toBeNull();
    expect(() => idempotencyKey("short")).toThrow(/Idempotency-Key/);
  });
});
