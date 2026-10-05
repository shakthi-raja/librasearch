import { describe, expect, it } from "vitest";
import { labelUrl, parseScan } from "@/lib/circulation/scan";
import { issueCardToken, verifyCardToken } from "@/server/auth/card";

const SECRET = "a-test-secret-that-is-long-enough-1234";

describe("parseScan", () => {
  it("reads a printed barcode in any case", () => {
    expect(parseScan(" ls26000005 ")).toEqual({ kind: "copy", barcode: "LS26000005" });
  });

  it("reads the barcode out of a label URL", () => {
    expect(parseScan("https://library.example/c/LS26000005")).toEqual({
      kind: "copy",
      barcode: "LS26000005",
    });
    expect(parseScan(labelUrl("http://localhost:3000", "LS26000163"))).toEqual({
      kind: "copy",
      barcode: "LS26000163",
    });
  });

  it("reads a library card", () => {
    const { qr, token } = issueCardToken("PES1UG24CS001", SECRET);
    expect(parseScan(qr)).toEqual({ kind: "card", token });
  });

  it("ignores anything else", () => {
    expect(parseScan("https://example.org/c/LS123")).toBeNull();
    expect(parseScan("9780078022159")).toBeNull();
    expect(parseScan("LSCARD:not-a-token")).toBeNull();
  });
});

describe("card tokens", () => {
  const now = new Date("2026-10-02T12:00:00Z");

  it("verify while fresh", () => {
    const { token } = issueCardToken("PES1UG24CS001", SECRET, now);
    expect(verifyCardToken(token, SECRET, now)).toEqual({
      ok: true,
      universityId: "PES1UG24CS001",
    });
  });

  it("expire after five minutes", () => {
    const { token } = issueCardToken("PES1UG24CS001", SECRET, now);
    const later = new Date(now.getTime() + 301_000);
    expect(verifyCardToken(token, SECRET, later)).toEqual({ ok: false, reason: "EXPIRED" });
  });

  it("refuse a changed id or another secret", () => {
    const { token } = issueCardToken("PES1UG24CS001", SECRET, now);
    const forged = token.replace("PES1UG24CS001", "PES1UG24CS002");
    expect(verifyCardToken(forged, SECRET, now)).toEqual({ ok: false, reason: "FORGED" });
    expect(verifyCardToken(token, `${SECRET}x`, now)).toEqual({ ok: false, reason: "FORGED" });
    expect(verifyCardToken("garbage", SECRET, now)).toEqual({ ok: false, reason: "MALFORMED" });
  });
});
