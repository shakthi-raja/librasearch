import { describe, expect, it } from "vitest";
import { adminEnvSchema, appEnvSchema, EnvError, parseEnv } from "@/lib/config/schema";

const valid = {
  DB_NAME: "librasearch",
  DB_AUTH_PASSWORD: "auth-secret-001",
  DB_STUDENT_PASSWORD: "student-secret-1",
  DB_FACULTY_PASSWORD: "faculty-secret-1",
  DB_LIBRARIAN_PASSWORD: "librarian-secret-1",
  REDIS_URL: "redis://:redis-secret@127.0.0.1:6380/0",
  CARD_SECRET: "card-secret-that-is-long-enough-0001",
};

describe("app environment", () => {
  it("applies defaults for optional settings", () => {
    const env = parseEnv(appEnvSchema, valid);
    expect(env.DB_PORT).toBe(3307);
    expect(env.EMBEDDING_DIM).toBe(384);
    expect(env.SESSION_IDLE_HOURS).toBe(168);
  });

  it("coerces numeric strings", () => {
    const env = parseEnv(appEnvSchema, { ...valid, DB_PORT: "3310", WORKER_POLL_MS: "500" });
    expect(env.DB_PORT).toBe(3310);
    expect(env.WORKER_POLL_MS).toBe(500);
  });

  it("treats empty strings as unset", () => {
    const env = parseEnv(appEnvSchema, { ...valid, LOG_LEVEL: "" });
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("rejects placeholder secrets", () => {
    expect(() => parseEnv(appEnvSchema, { ...valid, DB_STUDENT_PASSWORD: "change-me" })).toThrow(
      EnvError,
    );
  });

  it("names the variable without leaking its value", () => {
    try {
      parseEnv(appEnvSchema, { ...valid, DB_FACULTY_PASSWORD: "short" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvError);
      const message = (error as EnvError).message;
      expect(message).toContain("DB_FACULTY_PASSWORD");
      expect(message).not.toContain("short");
    }
  });

  it("does not expose the admin credential to the app", () => {
    const env = parseEnv(appEnvSchema, { ...valid, DB_ADMIN_PASSWORD: "admin-secret-1" });
    expect(env).not.toHaveProperty("DB_ADMIN_PASSWORD");
  });
});

describe("admin environment", () => {
  it("requires the admin password", () => {
    expect(() => parseEnv(adminEnvSchema, { DB_NAME: "librasearch" })).toThrow(/DB_ADMIN_PASSWORD/);
  });

  it("requires a long card secret", () => {
    expect(() => parseEnv(appEnvSchema, { ...valid, CARD_SECRET: "too-short-secret" })).toThrow(
      /CARD_SECRET/,
    );
  });
});
