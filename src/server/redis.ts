import "server-only";
import { Redis } from "ioredis";
import { env } from "@/lib/config/env";

const globalForRedis = globalThis as unknown as { librasearchRedis?: Redis };

/**
 * Shared Redis client. Redis is never a source of truth: callers must keep
 * working when it is down, so commands fail fast instead of queueing. Keys are
 * prefixed with the database name.
 */
export function redis(): Redis {
  globalForRedis.librasearchRedis ??= new Redis(env().REDIS_URL, {
    // one Redis can serve several databases (development and the test
    // schema); every key belongs to the database it describes
    keyPrefix: `${env().DB_NAME}:`,
    lazyConnect: false,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    retryStrategy: (attempt) => Math.min(attempt * 500, 5_000),
  });
  return globalForRedis.librasearchRedis;
}

/** Resolves true once the client is ready, false if it is not within the timeout. */
export function redisReady(timeoutMs = 2_000): Promise<boolean> {
  const client = redis();
  if (client.status === "ready") return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      client.off("ready", onReady);
      resolve(false);
    }, timeoutMs);
    const onReady = () => {
      clearTimeout(timer);
      resolve(true);
    };
    client.once("ready", onReady);
  });
}

/**
 * The client once it is connected, or null. A new process waits briefly for
 * the first connection instead of failing its first commands; after that a
 * Redis outage costs nothing but the cache.
 */
export async function connectedRedis(timeoutMs = 300): Promise<Redis | null> {
  const client = redis();
  if (client.status === "ready") return client;
  return (await redisReady(timeoutMs)) ? client : null;
}
