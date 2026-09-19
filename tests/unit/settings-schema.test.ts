import { describe, expect, it } from "vitest";
import { settingsSchema } from "@/lib/validation/settings";

const valid = {
  finePerDay: "5",
  fineCap: "200",
  lostCopyFee: "500",
  unpaidFineThreshold: "100",
  holdExpiryHours: "48",
  busyLoanDays: "7",
  waitsForBusyLoan: "3",
  shortLoanDays: "3",
  shortageThreshold: "20",
  weakMatchThreshold: "0.55",
};

describe("settingsSchema", () => {
  it("coerces the form strings into numbers", () => {
    const parsed = settingsSchema.parse(valid);
    expect(parsed.finePerDay).toBe(5);
    expect(parsed.weakMatchThreshold).toBe(0.55);
  });

  it("keeps the fine cap at or above the daily fine", () => {
    expect(settingsSchema.safeParse({ ...valid, fineCap: "2" }).success).toBe(false);
  });

  it("keeps a short loan shorter than a busy-period loan", () => {
    expect(settingsSchema.safeParse({ ...valid, shortLoanDays: "9" }).success).toBe(false);
  });

  it("rejects out-of-range values", () => {
    expect(settingsSchema.safeParse({ ...valid, weakMatchThreshold: "1.2" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...valid, holdExpiryHours: "0" }).success).toBe(false);
  });
});
