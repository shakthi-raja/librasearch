import "server-only";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { FineRecord } from "@/lib/circulation/types";
import { withTransaction } from "@/server/db/transaction";
import { AppError } from "@/server/http/errors";

type FineRow = RowDataPacket & {
  fine_id: number;
  loan_id: number;
  amount: string;
  days_overdue: number;
  reason: string;
  status: string;
  created_at: Date;
  settled_at: Date | null;
  waiver_reason: string | null;
  member_id: number;
  member_name: string;
  university_id: string;
  book_id: number;
  title: string;
  barcode: string;
  edition_no: number;
  settled_by_name: string | null;
};

export async function listFines(db: Pool) {
  const [rows] = await db.query<FineRow[]>(
    `SELECT fine_id, loan_id, amount, days_overdue, reason, status, created_at,
            settled_at, waiver_reason, member_id, member_name, university_id,
            book_id, title, barcode, edition_no, settled_by_name
       FROM v_fines
      ORDER BY (status = 'UNPAID') DESC, created_at DESC
      LIMIT 60`,
  );
  return rows.map(
    (row) =>
      ({
        fineId: Number(row.fine_id),
        loanId: Number(row.loan_id),
        amount: String(row.amount),
        daysOverdue: Number(row.days_overdue),
        reason: row.reason,
        status: row.status as FineRecord["status"],
        createdAt: row.created_at,
        settledAt: row.settled_at,
        waiverReason: row.waiver_reason,
        memberId: Number(row.member_id),
        memberName: row.member_name,
        universityId: row.university_id,
        bookId: Number(row.book_id),
        title: row.title,
        barcode: row.barcode,
        editionNo: Number(row.edition_no),
        settledByName: row.settled_by_name,
      }) satisfies FineRecord,
  );
}

export async function settleFine(
  db: Pool,
  input: { fineId: number; action: "PAID" | "WAIVED"; reason: string | null; actorId: number },
) {
  await withTransaction(db, async (connection) => {
    await connection.query("SET @app_user_id = ?", [input.actorId]);

    const [result] =
      input.action === "PAID"
        ? await connection.query<ResultSetHeader>(
            "UPDATE fines SET status = 'PAID', settled_at = NOW(3), settled_by = ? WHERE fine_id = ? AND status = 'UNPAID'",
            [input.actorId, input.fineId],
          )
        : await connection.query<ResultSetHeader>(
            "UPDATE fines SET status = 'WAIVED', settled_at = NOW(3), settled_by = ?, waiver_reason = ? WHERE fine_id = ? AND status = 'UNPAID'",
            [input.actorId, input.reason, input.fineId],
          );

    if (result.affectedRows === 0) {
      throw new AppError("CONFLICT", "That fine is already settled.");
    }
  });
}
