import { describe, expect, it } from "vitest";
import { hashPassword, needsRehash, verifyDecoy, verifyPassword } from "@/server/auth/password";

describe("password hashing", () => {
  it("produces an argon2id hash with the configured parameters", async () => {
    const stored = await hashPassword("correct horse 42");
    expect(stored).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(needsRehash(stored)).toBe(false);
  });

  it("salts every hash", async () => {
    const [a, b] = await Promise.all([hashPassword("same input 1"), hashPassword("same input 1")]);
    expect(a).not.toBe(b);
  });

  it("verifies the right password and rejects a wrong one", async () => {
    const stored = await hashPassword("Libra@2026x");
    await expect(verifyPassword(stored, "Libra@2026x")).resolves.toBe(true);
    await expect(verifyPassword(stored, "libra@2026x")).resolves.toBe(false);
  });

  it("treats canonically equivalent unicode input as the same password", async () => {
    const stored = await hashPassword("café au lait 7");
    await expect(verifyPassword(stored, "café au lait 7")).resolves.toBe(true);
  });

  it("returns false instead of throwing on a malformed stored hash", async () => {
    await expect(verifyPassword("not-a-hash", "anything")).resolves.toBe(false);
  });

  it("flags hashes made with other algorithms or weaker parameters", () => {
    expect(needsRehash("$2b$12$abcdefghijklmnopqrstuv")).toBe(true);
    expect(needsRehash("$argon2id$v=19$m=4096,t=3,p=1$c2FsdA$aGFzaA")).toBe(true);
    expect(needsRehash("$argon2i$v=19$m=19456,t=2,p=1$c2FsdA$aGFzaA")).toBe(true);
  });

  it("always fails the decoy check", async () => {
    await expect(verifyDecoy("decoy-password-for-unknown-accounts")).resolves.toBe(false);
  });
});
