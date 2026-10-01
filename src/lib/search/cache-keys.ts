/**
 * Redis keys shared by the web app and the worker. Cached search results are
 * keyed by the catalogue version; the worker bumps it whenever it changes the
 * vector index, so a new or edited book is never hidden behind a cache.
 */
export const CATALOGUE_VERSION_KEY = "search:catalogue-version";

export const TRENDING_PREFIX = "search:trending:";

/** Trending counts are kept per day, as YYYYMMDD in UTC. */
export function trendingKey(day: Date): string {
  return `${TRENDING_PREFIX}${day.toISOString().slice(0, 10).replace(/-/g, "")}`;
}
