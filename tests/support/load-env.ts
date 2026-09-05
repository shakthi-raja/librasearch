import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Loads librasearch/.env into process.env when it exists. CI sets variables directly. */
export function loadDotEnv() {
  const file = fileURLToPath(new URL("../../.env", import.meta.url));
  if (existsSync(file)) process.loadEnvFile(file);
}

/** The database suite never touches the development schema. */
export function testDatabaseName() {
  const base = process.env.DB_NAME ?? "librasearch";
  return base.endsWith("_test") ? base : `${base}_test`;
}
