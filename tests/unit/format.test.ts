import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatMoney, formatPeriod } from "@/lib/format";

describe("formatDate", () => {
  it("renders a UTC instant as an Indian date", () => {
    expect(formatDate(new Date("2026-09-13T06:30:00Z"))).toBe("13 Sep 2026");
  });

  it("moves the date forward when the instant is late UTC", () => {
    expect(formatDate(new Date("2026-09-13T20:30:00Z"))).toBe("14 Sep 2026");
  });
});

describe("formatDateTime", () => {
  it("renders the Indian date and a 12-hour clock", () => {
    expect(formatDateTime(new Date("2026-09-13T06:30:00Z"))).toBe("13 Sep 2026, 12:00 pm");
  });
});

describe("formatMoney", () => {
  it("uses the library's rupee notation and two decimals", () => {
    expect(formatMoney("50.00")).toBe("Rs 50.00");
    expect(formatMoney(12.5)).toBe("Rs 12.50");
    expect(formatMoney(0)).toBe("Rs 0.00");
  });
});

describe("formatPeriod", () => {
  it("names the three lending rules", () => {
    expect(formatPeriod("STANDARD")).toBe("Regular loan");
    expect(formatPeriod("HIGH_DEMAND")).toBe("High demand");
    expect(formatPeriod("SHORT_LOAN")).toBe("Short loan");
  });
});
