const HOUR_MS = 60 * 60 * 1000;

export type SessionWindow = {
  idleHours: number;
  absoluteHours: number;
};

/**
 * A session ends at the earlier of its idle deadline (sliding with activity)
 * and its absolute deadline (fixed at creation).
 */
export function sessionExpiry(createdAt: Date, lastSeenAt: Date, window: SessionWindow): Date {
  const idle = lastSeenAt.getTime() + window.idleHours * HOUR_MS;
  const absolute = createdAt.getTime() + window.absoluteHours * HOUR_MS;
  return new Date(Math.min(idle, absolute));
}

/**
 * Sliding the idle deadline on every request would mean a write per request.
 * Refresh only once a meaningful share of the idle window has passed.
 */
export function shouldTouch(lastSeenAt: Date, now: Date, window: SessionWindow): boolean {
  const refreshAfterMs = Math.min(window.idleHours * HOUR_MS * 0.1, HOUR_MS);
  return now.getTime() - lastSeenAt.getTime() >= refreshAfterMs;
}

export function isExpired(expiresAt: Date, revokedAt: Date | null, now: Date): boolean {
  return revokedAt !== null || expiresAt.getTime() <= now.getTime();
}
