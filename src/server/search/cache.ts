import "server-only";
import { createHash } from "node:crypto";
import { CATALOGUE_VERSION_KEY } from "@/lib/search/cache-keys";
import { connectedRedis } from "@/server/redis";

export const digest = (value: unknown) =>
  createHash("sha1").update(JSON.stringify(value)).digest("base64url");

/** The current catalogue version, or null when Redis cannot say. */
export async function catalogueVersion(): Promise<string | null> {
  try {
    const client = await connectedRedis();
    return client ? ((await client.get(CATALOGUE_VERSION_KEY)) ?? "0") : null;
  } catch {
    return null;
  }
}

/**
 * Read-through cache. A null key, a Redis error or a miss all compute the
 * value; Redis being down only costs speed.
 */
export async function cached<T>(
  key: string | null,
  seconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const client = key ? await connectedRedis() : null;
  if (!key || !client) return compute();
  try {
    const hit = await client.get(key);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch {
    // an unreadable cache is a miss
    return compute();
  }
  const value = await compute();
  client.set(key, JSON.stringify(value), "EX", seconds).catch(() => undefined);
  return value;
}
