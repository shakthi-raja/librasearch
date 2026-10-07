import { describe, expect, it } from "vitest";
import { estimateWait } from "@/lib/circulation/wait";

const now = new Date("2026-10-07T10:00:00Z");
const inDays = (n: number) => new Date(now.getTime() + n * 24 * 3600 * 1000);

describe("estimateWait", () => {
  it("is the next due date when nobody is ahead", () => {
    const wait = estimateWait({ dueDates: [inDays(5), inDays(2)], ahead: 0, loanDays: 14, now });
    expect(wait).toEqual({ date: inDays(2), overdue: false, ahead: 0 });
  });

  it("hands each returning copy to the next member in line", () => {
    const wait = estimateWait({ dueDates: [inDays(5), inDays(2)], ahead: 1, loanDays: 14, now });
    expect(wait?.date).toEqual(inDays(5));
  });

  it("adds a loan period once every copy is spoken for", () => {
    const wait = estimateWait({ dueDates: [inDays(5), inDays(2)], ahead: 2, loanDays: 7, now });
    expect(wait?.date).toEqual(inDays(9));
  });

  it("says an overdue copy could be back today", () => {
    const wait = estimateWait({ dueDates: [inDays(-3)], ahead: 0, loanDays: 14, now });
    expect(wait).toEqual({ date: now, overdue: true, ahead: 0 });
  });

  it("has nothing to say when no copy is out on loan", () => {
    expect(estimateWait({ dueDates: [], ahead: 0, loanDays: 14, now })).toBeNull();
  });
});
