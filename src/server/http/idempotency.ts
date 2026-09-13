import "server-only";
import { AppError } from "@/server/http/errors";
import { redis } from "@/server/redis";

const TTL_SECONDS = 24 * 60 * 60;
const PREFIX = "ls:idem";

type Entry = { expiresAt: number; value: unknown };

// Redis may be down; the process-local map keeps a double click idempotent even
// then. Redis carries the same entries across instances.
const memory = new Map<string, Entry>();

/** Test seam: the process-local fallback outlives a single test otherwise. */
export function resetIdempotency() {
  memory.clear();
}

/** A repeated mutation carries the first answer, not a second write. */
export async function withIdempotency<T>(
  key: string | null,
  scope: string,
  work: () => Promise<T>,
): Promise<T> {
  if (key === null) return work();

  const cacheKey = `${PREFIX}:${scope}:${key}`;
  const now = Date.now();

  for (const [stored, entry] of memory) {
    if (entry.expiresAt <= now) memory.delete(stored);
  }

  const local = memory.get(cacheKey);
  if (local && local.expiresAt > now) return local.value as T;

  try {
    const cached = await redis().get(cacheKey);
    if (cached !== null) {
      const value = JSON.parse(cached) as T;
      memory.set(cacheKey, { expiresAt: now + TTL_SECONDS * 1000, value });
      return value;
    }
  } catch {
    // Redis is disposable; the write below still happens.
  }

  const value = await work();
  memory.set(cacheKey, { expiresAt: now + TTL_SECONDS * 1000, value });

  try {
    await redis().set(cacheKey, JSON.stringify(value), "EX", TTL_SECONDS);
  } catch {
    // The local entry still protects this process.
  }

  return value;
}

/** Accepts a scanner-safe token, or nothing. */
export function idempotencyKey(value: string | null) {
  if (value === null || value === "") return null;
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(value)) {
    throw new AppError("BAD_REQUEST", "Idempotency-Key must be 8 to 128 letters, digits, - or _.");
  }
  return value;
}
