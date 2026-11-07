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

/** The client once it can take commands, or null if redis does not answer in time. */
function ready(): Promise<Redis | null> {
  const current = redis();
  if (current.status === "ready") return Promise.resolve(current);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 3_000);
    current.once("ready", () => {
      clearTimeout(timer);
      resolve(current);
    });
  });
}

/**
 * Tells the web app that the vector index changed, so cached neighbour lists
 * keyed by the old version stop being used. Redis being down is not an error
 * here: the caches expire on their own within the hour.
 */
export async function bumpCatalogueVersion() {
  try {
    const client = await ready();
    if (!client) throw new Error("redis did not answer");
    await client.incr(CATALOGUE_VERSION_KEY);
  } catch (error) {
    log.warn({ err: error }, "could not bump the catalogue version");
  }
}

// disconnect rather than quit: a quit sent while still connecting is refused
// without the offline queue, and the open socket would keep a script alive
export async function closeWorkerRedis() {
  client?.disconnect();
  client = undefined;
}
