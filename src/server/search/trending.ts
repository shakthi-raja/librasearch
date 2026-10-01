import "server-only";
import { trendingKey } from "@/lib/search/cache-keys";
import { connectedRedis } from "@/server/redis";
import { cached } from "./cache";

const KEEP_DAYS = 8;

/** Searches that found something count towards what is trending this week. */
export async function recordSearch(original: string, found: number) {
  const query = original.trim().toLowerCase();
  if (found === 0 || query.length < 2 || query.length > 60) return;
  const key = trendingKey(new Date());
  try {
    const client = await connectedRedis();
    await client
      ?.multi()
      .zincrby(key, 1, query)
      .expire(key, KEEP_DAYS * 24 * 3600)
      .exec();
  } catch {
    // trending is a nicety; a search never fails over it
  }
}

export type Trending = { query: string; count: number };

/** The most searched queries over the last seven days, cached for five minutes. */
export async function trendingSearches(limit = 8): Promise<Trending[]> {
  return cached("search:trending:top", 300, async () => {
    const keys = Array.from({ length: 7 }, (_, i) =>
      trendingKey(new Date(Date.now() - i * 24 * 3600 * 1000)),
    );
    try {
      const client = await connectedRedis();
      if (!client) return [];
      const reply = (await client.zunion(keys.length, ...keys, "WITHSCORES")) as unknown[];
      // RESP3 servers answer with [member, score] pairs, RESP2 with a flat list
      const pairs: Trending[] = [];
      if (Array.isArray(reply[0])) {
        for (const pair of reply as [string, string][]) {
          pairs.push({ query: String(pair[0]), count: Number(pair[1]) });
        }
      } else {
        for (let i = 0; i < reply.length; i += 2) {
          pairs.push({ query: String(reply[i]), count: Number(reply[i + 1]) });
        }
      }
      return pairs
        .sort((a, b) => b.count - a.count || a.query.localeCompare(b.query))
        .slice(0, limit);
    } catch {
      return [];
    }
  });
}
