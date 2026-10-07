import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { estimateWait, type WaitEstimate } from "@/lib/circulation/wait";
import { pool } from "@/server/db/pool";

const REGULAR_LOAN_DAYS = 14;

/**
 * The wait for a book whose borrowable copies are all out, as this reader
 * would see it: behind everyone already waiting, or at their own place in the
 * queue if they hold one.
 */
export async function waitForBook(
  bookId: number,
  readerId: number | null,
  now = new Date(),
): Promise<WaitEstimate | null> {
  const db = pool("student");
  const [[loans], [queue], [settings]] = await Promise.all([
    db.query<RowDataPacket[]>(
      `SELECT due_at FROM v_copy_lookup
        WHERE book_id = ? AND status = 'ON_LOAN' AND loan_policy <> 'REFERENCE_ONLY' AND due_at IS NOT NULL`,
      [bookId],
    ),
    db.query<RowDataPacket[]>(
      `SELECT member_id FROM v_hold_queue
        WHERE book_id = ? AND status = 'WAITING' ORDER BY queue_position`,
      [bookId],
    ),
    db.query<RowDataPacket[]>(
      "SELECT busy_loan_days, waits_for_busy_loan FROM library_settings LIMIT 1",
    ),
  ]);

  const waiting = queue.map((row) => Number(row.member_id));
  const mine = readerId === null ? -1 : waiting.indexOf(readerId);
  const ahead = mine >= 0 ? mine : waiting.length;
  const busy = settings[0];
  const loanDays =
    busy && waiting.length >= Number(busy.waits_for_busy_loan)
      ? Number(busy.busy_loan_days)
      : REGULAR_LOAN_DAYS;

  return estimateWait({
    dueDates: loans.map((row) => new Date(row.due_at)),
    ahead,
    loanDays,
    now,
  });
}
