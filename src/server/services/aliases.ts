import "server-only";
import type { AliasInput } from "@/lib/validation/aliases";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { forgetAliases } from "@/server/search/aliases";

/** Adds an alias or changes what it expands to; seeded ones become the library's own. */
export async function saveAlias(input: AliasInput, actorId: number) {
  await withTransaction(pool("librarian"), async (conn) => {
    await conn.query("SET @app_user_id = ?", [actorId]);
    await conn.query(
      `INSERT INTO search_aliases (alias, expansion, source, created_by) VALUES (?, ?, 'LIBRARIAN', ?)
       ON DUPLICATE KEY UPDATE expansion = VALUES(expansion), source = 'LIBRARIAN'`,
      [input.alias, input.expansion, actorId],
    );
  });
  await forgetAliases();
}

export async function removeAlias(alias: string, actorId: number) {
  await withTransaction(pool("librarian"), async (conn) => {
    await conn.query("SET @app_user_id = ?", [actorId]);
    await conn.query("DELETE FROM search_aliases WHERE alias = ?", [alias]);
  });
  await forgetAliases();
}
