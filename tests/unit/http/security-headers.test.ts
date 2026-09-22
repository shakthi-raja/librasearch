import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, newNonce, securityHeaders } from "@/server/http/security-headers";

const directives = (policy: string) =>
  new Map(
    policy.split("; ").map((part) => {
      const [name, ...values] = part.split(" ");
      return [name, values] as const;
    }),
  );

describe("newNonce", () => {
  it("returns a fresh base64 value each time", () => {
    const a = newNonce();
    const b = newNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(a).not.toBe(b);
  });
});

describe("contentSecurityPolicy", () => {
  it("allows scripts only from this origin or with the request nonce", () => {
    const csp = directives(contentSecurityPolicy({ nonce: "abc", production: true }));
    expect(csp.get("script-src")).toEqual(["'self'", "'nonce-abc'", "'strict-dynamic'"]);
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
    expect(csp.get("form-action")).toEqual(["'self'"]);
  });

  it("adds unsafe-eval only outside production", () => {
    const dev = directives(contentSecurityPolicy({ nonce: "abc", production: false }));
    expect(dev.get("script-src")).toContain("'unsafe-eval'");
    const prod = directives(contentSecurityPolicy({ nonce: "abc", production: true }));
    expect(prod.get("script-src")).not.toContain("'unsafe-eval'");
  });
});

describe("securityHeaders", () => {
  it("denies framing and sniffing on every response", () => {
    const headers = securityHeaders({ nonce: "abc", production: false });
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("geolocation=()");
  });

  it("sends HSTS in production only", () => {
    expect(securityHeaders({ nonce: "a", production: false })).not.toHaveProperty(
      "Strict-Transport-Security",
    );
    expect(securityHeaders({ nonce: "a", production: true })["Strict-Transport-Security"]).toMatch(
      /^max-age=\d+/,
    );
  });
});
