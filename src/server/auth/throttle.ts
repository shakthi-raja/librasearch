import "server-only";
import { RateLimiterMemory, RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { env } from "@/lib/config/env";
import { redis } from "@/server/redis";

/** Failed sign-ins in a row before the account locks, and for how long. */
export const LOCKOUT = { failures: 5, minutes: 15 } as const;

const WINDOW_SECONDS = 15 * 60;

// Per address and per account, shared across processes through Redis. When
// Redis is unreachable the in-process limiter takes over with the same rules.
function limiter(keyPrefix: string, points: number) {
  const insuranceLimiter = new RateLimiterMemory({ keyPrefix, points, duration: WINDOW_SECONDS });
  try {
    return new RateLimiterRedis({
      storeClient: redis(),
      keyPrefix,
      points,
      duration: WINDOW_SECONDS,
      rejectIfRedisNotReady: true,
      insuranceLimiter,
    });
  } catch {
    return insuranceLimiter;
  }
}

let limiters:
  | { byIp: RateLimiterRedis | RateLimiterMemory; byAccount: RateLimiterRedis | RateLimiterMemory }
  | undefined;

function get() {
  // keys carry the schema name so environments sharing a Redis never mix
  const prefix = `ls:${env().DB_NAME}:login`;
  limiters ??= { byIp: limiter(`${prefix}:ip`, 30), byAccount: limiter(`${prefix}:id`, 10) };
  return limiters;
}

export type ThrottleResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/** Spends one attempt for this address and identifier. */
export async function consumeLoginAttempt(
  ip: string | null,
  identifier: string,
): Promise<ThrottleResult> {
  const { byIp, byAccount } = get();
  try {
    await Promise.all([
      ip ? byIp.consume(ip) : Promise.resolve(),
      byAccount.consume(identifier.toLowerCase()),
    ]);
    return { allowed: true };
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      return { allowed: false, retryAfterSeconds: Math.ceil(error.msBeforeNext / 1000) };
    }
    throw error;
  }
}

/** A successful sign-in clears the account's counter, not the address's. */
export async function clearAccountAttempts(identifier: string) {
  await get()
    .byAccount.delete(identifier.toLowerCase())
    .catch(() => undefined);
}
