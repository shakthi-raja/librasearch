import { describe, expect, it } from "vitest";
import { isExpired, sessionExpiry, shouldTouch } from "@/server/auth/session-policy";

const window = { idleHours: 168, absoluteHours: 720 };
const at = (iso: string) => new Date(iso);

describe("session expiry", () => {
  it("ends seven days after the last activity", () => {
    const created = at("2026-09-01T10:00:00Z");
    expect(sessionExpiry(created, at("2026-09-03T10:00:00Z"), window)).toEqual(
      at("2026-09-10T10:00:00Z"),
    );
  });

  it("never outlives the absolute window, however active the user is", () => {
    const created = at("2026-09-01T10:00:00Z");
    expect(sessionExpiry(created, at("2026-09-29T10:00:00Z"), window)).toEqual(
      at("2026-10-01T10:00:00Z"),
    );
  });

  it("is expired at the deadline and when revoked", () => {
    const deadline = at("2026-09-10T10:00:00Z");
    expect(isExpired(deadline, null, at("2026-09-10T09:59:59Z"))).toBe(false);
    expect(isExpired(deadline, null, deadline)).toBe(true);
    expect(isExpired(deadline, at("2026-09-02T00:00:00Z"), at("2026-09-02T00:00:01Z"))).toBe(true);
  });
});

describe("session touch throttling", () => {
  it("skips the write for recent activity", () => {
    expect(shouldTouch(at("2026-09-01T10:00:00Z"), at("2026-09-01T10:30:00Z"), window)).toBe(false);
  });

  it("refreshes after an hour at most", () => {
    expect(shouldTouch(at("2026-09-01T10:00:00Z"), at("2026-09-01T11:00:00Z"), window)).toBe(true);
  });

  it("refreshes sooner for short idle windows", () => {
    const short = { idleHours: 2, absoluteHours: 24 };
    expect(shouldTouch(at("2026-09-01T10:00:00Z"), at("2026-09-01T10:12:00Z"), short)).toBe(true);
  });
});
