import { Redis } from "ioredis";
import { env } from "@/lib/config/env";
import { CATALOGUE_VERSION_KEY } from "@/lib/search/cache-keys";
import { log } from "./log";

let client: Redis | undefined;

function redis() {
  client ??= new Redis(env().REDIS_URL, {
    keyPrefix: `${env().DB_NAME}:`,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
  });
  return client;
}

/**
 * Tells the web app that the vector index changed, so cached neighbour lists
 * keyed by the old version stop being used. Redis being down is not an error
 * here: the caches expire on their own within the hour.
 */
export async function bumpCatalogueVersion() {
  try {
    await redis().incr(CATALOGUE_VERSION_KEY);
  } catch (error) {
    log.warn({ err: error }, "could not bump the catalogue version");
  }
}

export async function closeWorkerRedis() {
  await client?.quit().catch(() => undefined);
  client = undefined;
}
