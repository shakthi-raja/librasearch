import "server-only";
import { Redis } from "ioredis";
import { env } from "@/lib/config/env";

const globalForRedis = globalThis as unknown as { librasearchRedis?: Redis };

/**
 * Shared Redis client. Redis is never a source of truth: callers must keep
 * working when it is down, so commands fail fast instead of queueing.
 */
export function redis(): Redis {
  globalForRedis.librasearchRedis ??= new Redis(env().REDIS_URL, {
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
