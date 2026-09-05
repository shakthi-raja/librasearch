import "server-only";
import { type AppEnv, appEnvSchema, parseEnv } from "./schema";

let cached: AppEnv | undefined;

/** Validated settings for the web and worker processes, parsed once per process. */
export function env(): AppEnv {
  cached ??= parseEnv(appEnvSchema, process.env);
  return cached;
}
