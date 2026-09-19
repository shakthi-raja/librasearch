import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";

export type AuditRow = {
  auditId: number;
  tableName: string;
  recordId: string;
  action: string;
  actor: string | null;
  changedAt: string;
  changed: { key: string; from: string; to: string }[];
};

const printable = (value: unknown) => {
  if (value === null || value === undefined) return "empty";
  if (typeof value === "string") return value.length > 60 ? `${value.slice(0, 57)}...` : value;
  return JSON.stringify(value);
};

/** The fields that actually moved between the old and the new row image. */
function changes(oldData: unknown, newData: unknown): AuditRow["changed"] {
  const before = (oldData ?? {}) as Record<string, unknown>;
  const after = (newData ?? {}) as Record<string, unknown>;
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const out: AuditRow["changed"] = [];
  for (const key of keys) {
    if (key === "updated_at") continue;
    const from = JSON.stringify(before[key]);
    const to = JSON.stringify(after[key]);
    if (from !== to) out.push({ key, from: printable(before[key]), to: printable(after[key]) });
  }
  return out.slice(0, 6);
}

export async function auditTables(): Promise<string[]> {
  const [rows] = await pool("librarian").query<RowDataPacket[]>(
    "SELECT DISTINCT table_name FROM audit_log ORDER BY table_name",
  );
  return rows.map((row) => String(row.table_name));
}

export async function auditTrail(table: string | null, limit = 100): Promise<AuditRow[]> {
  const [rows] = await pool("librarian").query<RowDataPacket[]>(
    `SELECT a.audit_id, a.table_name, a.record_id, a.action, a.changed_at,
            a.old_data, a.new_data, u.full_name AS actor
       FROM audit_log a
       LEFT JOIN users u ON u.user_id = a.changed_by
      WHERE (? IS NULL OR a.table_name = ?)
      ORDER BY a.changed_at DESC, a.audit_id DESC
      LIMIT ?`,
    [table, table, limit],
  );

  return rows.map((row) => ({
    auditId: Number(row.audit_id),
    tableName: String(row.table_name),
    recordId: String(row.record_id),
    action: String(row.action),
    actor: row.actor ?? null,
    changedAt: new Date(row.changed_at).toISOString(),
    changed: changes(row.old_data, row.new_data),
  }));
}
