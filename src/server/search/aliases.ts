import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";
import { log } from "@/server/log";
import { connectedRedis } from "@/server/redis";

const CACHE_KEY = "search:aliases:v1";
const CACHE_SECONDS = 600;

export type AliasRow = { alias: string; expansion: string; source: "SEEDED" | "LIBRARIAN" };

export async function listAliases(): Promise<AliasRow[]> {
  const [rows] = await pool("student").query<RowDataPacket[]>(
    "SELECT alias, expansion, source FROM search_aliases ORDER BY alias",
  );
  return rows.map((row) => ({
    alias: String(row.alias),
    expansion: String(row.expansion),
    source: row.source as AliasRow["source"],
  }));
}

/**
 * The alias map every search consults. It changes rarely, so it lives in
 * Redis for ten minutes; without Redis it comes straight from MySQL.
 */
export async function aliasMap(): Promise<Map<string, string>> {
  const client = await connectedRedis();
  try {
    const cached = await client?.get(CACHE_KEY);
    if (cached) return new Map(JSON.parse(cached) as [string, string][]);
  } catch (error) {
    log.debug({ err: error }, "alias cache unavailable");
  }
  const entries = (await listAliases()).map((row): [string, string] => [row.alias, row.expansion]);
  client?.set(CACHE_KEY, JSON.stringify(entries), "EX", CACHE_SECONDS).catch(() => undefined);
  return new Map(entries);
}

/** Called after a librarian changes an alias so the next search sees it. */
export async function forgetAliases() {
  const client = await connectedRedis();
  await client?.del(CACHE_KEY).catch(() => undefined);
}
