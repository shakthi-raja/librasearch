import { z } from "zod";

const port = z.coerce.number().int().min(1).max(65_535);
const positiveInt = z.coerce.number().int().positive();
const secret = z
  .string()
  .min(12, "must be at least 12 characters")
  .refine((value) => value !== "change-me", "still holds the placeholder value");

/** Settings the running app needs. The admin credential is deliberately absent. */
export const appEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DB_HOST: z.string().min(1).default("127.0.0.1"),
  DB_PORT: port.default(3307),
  DB_NAME: z.string().regex(/^[a-z][a-z0-9_]*$/, "lowercase letters, digits and underscores"),
  DB_AUTH_USER: z.string().min(1).default("app_auth"),
  DB_AUTH_PASSWORD: secret,
  DB_STUDENT_USER: z.string().min(1).default("app_student"),
  DB_STUDENT_PASSWORD: secret,
  DB_FACULTY_USER: z.string().min(1).default("app_faculty"),
  DB_FACULTY_PASSWORD: secret,
  DB_LIBRARIAN_USER: z.string().min(1).default("app_librarian"),
  DB_LIBRARIAN_PASSWORD: secret,
  DB_POOL_SIZE: positiveInt.max(100).default(10),

  QDRANT_URL: z.url().default("http://127.0.0.1:6333"),
  QDRANT_API_KEY: z.string().default(""),

  REDIS_URL: z.string().regex(/^rediss?:\/\//, "must be a redis:// or rediss:// URL"),

  EMBEDDING_MODEL: z.string().min(1).default("Xenova/bge-small-en-v1.5"),
  EMBEDDING_DIM: positiveInt.default(384),
  EMBEDDING_DTYPE: z.enum(["fp32", "fp16", "q8", "int8", "uint8", "q4"]).default("q8"),

  SESSION_COOKIE_NAME: z
    .string()
    .regex(/^[A-Za-z0-9_-]+$/)
    .default("ls_session"),
  SESSION_IDLE_HOURS: positiveInt.default(24 * 7),
  SESSION_ABSOLUTE_HOURS: positiveInt.default(24 * 30),

  WORKER_POLL_MS: positiveInt.min(100).default(2000),
  WORKER_BATCH_SIZE: positiveInt.max(500).default(25),
});

/** Migrations, seed and tests connect as the schema owner. */
export const adminEnvSchema = z.object({
  DB_HOST: z.string().min(1).default("127.0.0.1"),
  DB_PORT: port.default(3307),
  DB_NAME: appEnvSchema.shape.DB_NAME,
  DB_ADMIN_USER: z.string().min(1).default("root"),
  DB_ADMIN_PASSWORD: secret,
});

/** Provisioning creates one database account per application role. */
export const accountsEnvSchema = adminEnvSchema.extend({
  DB_AUTH_USER: appEnvSchema.shape.DB_AUTH_USER,
  DB_AUTH_PASSWORD: secret,
});

export type AppEnv = z.infer<typeof appEnvSchema>;
export type AccountsEnv = z.infer<typeof accountsEnvSchema>;
export type AdminEnv = z.infer<typeof adminEnvSchema>;

export class EnvError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`invalid environment:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
    this.name = "EnvError";
    this.issues = issues;
  }
}

/** Parses a source such as process.env. Messages name the variable, never its value. */
export function parseEnv<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined>,
) {
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ""),
  );
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    throw new EnvError(
      result.error.issues.map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`),
    );
  }
  return result.data as z.infer<T>;
}
