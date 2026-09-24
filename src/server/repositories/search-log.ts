import "server-only";
import type { Pool } from "mysql2/promise";

export type SearchLogEntry = {
  userId: number | null;
  query: string;
  mode: "KEYWORD" | "SEMANTIC" | "HYBRID";
  filters: Record<string, unknown>;
  resultCount: number;
  topScore: number | null;
  latencyMs: number;
};

export async function logSearch(db: Pool, entry: SearchLogEntry) {
  await db.execute(
    `INSERT INTO search_log (user_id, query_text, mode, filters, result_count, top_score, latency_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.userId,
      entry.query.slice(0, 500),
      entry.mode,
      JSON.stringify(entry.filters),
      Math.min(entry.resultCount, 65_535),
      entry.topScore === null ? null : Math.round(entry.topScore * 10_000) / 10_000,
      entry.latencyMs,
    ],
  );
}
