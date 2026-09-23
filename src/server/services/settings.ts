import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import type { SettingsInput } from "@/lib/validation/settings";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";

export type LibrarySettings = SettingsInput & { updatedAt: string };

export async function librarySettings(): Promise<LibrarySettings> {
  const [rows] = await pool("librarian").query<RowDataPacket[]>(
    `SELECT fine_per_day, fine_cap, lost_copy_fee, unpaid_fine_threshold,
            hold_expiry_hours, busy_loan_days, waits_for_busy_loan,
            short_loan_days, shortage_threshold, weak_match_threshold, updated_at
       FROM library_settings WHERE setting_id = 1`,
  );
  const row = rows[0];
  if (!row) throw new Error("library settings row is missing");
  return {
    finePerDay: Number(row.fine_per_day),
    fineCap: Number(row.fine_cap),
    lostCopyFee: Number(row.lost_copy_fee),
    unpaidFineThreshold: Number(row.unpaid_fine_threshold),
    holdExpiryHours: Number(row.hold_expiry_hours),
    busyLoanDays: Number(row.busy_loan_days),
    waitsForBusyLoan: Number(row.waits_for_busy_loan),
    shortLoanDays: Number(row.short_loan_days),
    shortageThreshold: Number(row.shortage_threshold),
    weakMatchThreshold: Number(row.weak_match_threshold),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function updateSettings(input: SettingsInput, actorId: number): Promise<void> {
  await withTransaction(pool("librarian"), async (conn) => {
    await conn.query("SET @app_user_id = ?", [actorId]);
    const [before] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM library_settings WHERE setting_id = 1 FOR UPDATE",
    );
    await conn.query(
      `UPDATE library_settings
          SET fine_per_day = ?, fine_cap = ?, lost_copy_fee = ?,
              unpaid_fine_threshold = ?, hold_expiry_hours = ?,
              busy_loan_days = ?, waits_for_busy_loan = ?, short_loan_days = ?,
              shortage_threshold = ?, weak_match_threshold = ?
        WHERE setting_id = 1`,
      [
        input.finePerDay,
        input.fineCap,
        input.lostCopyFee,
        input.unpaidFineThreshold,
        input.holdExpiryHours,
        input.busyLoanDays,
        input.waitsForBusyLoan,
        input.shortLoanDays,
        input.shortageThreshold,
        input.weakMatchThreshold,
      ],
    );
    const [after] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM library_settings WHERE setting_id = 1",
    );
    await conn.query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
       VALUES ('library_settings', '1', 'UPDATE', ?, ?, ?)`,
      [actorId, JSON.stringify(before[0] ?? {}), JSON.stringify(after[0] ?? {})],
    );
  });
}
