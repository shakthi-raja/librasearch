import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";

export type DeskOverview = {
  issuedToday: number;
  returnedToday: number;
  active: number;
  overdue: number;
  holdsReady: number;
  holdsWaiting: number;
  unpaid: { count: number; amount: number };
  overdueLoans: {
    loanId: number;
    title: string;
    barcode: string;
    memberName: string;
    universityId: string;
    dueAt: Date;
  }[];
  readyHolds: {
    holdId: number;
    title: string;
    memberName: string;
    universityId: string;
    barcode: string | null;
    pickupBy: Date | null;
  }[];
};

/** What the librarian needs at a glance when the desk opens. */
export async function deskOverview(): Promise<DeskOverview> {
  const db = pool("librarian");
  const [[counts], [overdueLoans], [readyHolds]] = await Promise.all([
    db.query<RowDataPacket[]>(
      `SELECT
         (SELECT COUNT(*) FROM loans WHERE issued_at >= CURDATE()) AS issued_today,
         (SELECT COUNT(*) FROM loans WHERE returned_at >= CURDATE()) AS returned_today,
         (SELECT COUNT(*) FROM loans WHERE returned_at IS NULL AND end_reason IS NULL) AS active,
         (SELECT COUNT(*) FROM loans
           WHERE returned_at IS NULL AND end_reason IS NULL AND due_at < NOW()) AS overdue,
         (SELECT COUNT(*) FROM holds WHERE status = 'READY') AS holds_ready,
         (SELECT COUNT(*) FROM holds WHERE status = 'WAITING') AS holds_waiting,
         (SELECT COUNT(*) FROM fines WHERE status = 'UNPAID') AS unpaid_count,
         (SELECT COALESCE(SUM(amount), 0) FROM fines WHERE status = 'UNPAID') AS unpaid_amount`,
    ),
    db.query<RowDataPacket[]>(
      `SELECT l.loan_id, b.title, c.barcode, u.full_name, u.university_id, l.due_at
         FROM loans l
         JOIN copies c   ON c.copy_id = l.copy_id
         JOIN editions e ON e.edition_id = c.edition_id
         JOIN books b    ON b.book_id = e.book_id
         JOIN users u    ON u.user_id = l.member_id
        WHERE l.returned_at IS NULL AND l.end_reason IS NULL AND l.due_at < NOW()
        ORDER BY l.due_at
        LIMIT 5`,
    ),
    db.query<RowDataPacket[]>(
      `SELECT hold_id, title, member_name, university_id, ready_barcode, pickup_by
         FROM v_hold_queue
        WHERE status = 'READY'
        ORDER BY pickup_by
        LIMIT 5`,
    ),
  ]);
  const row = counts[0] ?? ({} as RowDataPacket);

  return {
    issuedToday: Number(row.issued_today ?? 0),
    returnedToday: Number(row.returned_today ?? 0),
    active: Number(row.active ?? 0),
    overdue: Number(row.overdue ?? 0),
    holdsReady: Number(row.holds_ready ?? 0),
    holdsWaiting: Number(row.holds_waiting ?? 0),
    unpaid: { count: Number(row.unpaid_count ?? 0), amount: Number(row.unpaid_amount ?? 0) },
    overdueLoans: overdueLoans.map((loan) => ({
      loanId: Number(loan.loan_id),
      title: loan.title,
      barcode: loan.barcode,
      memberName: loan.full_name,
      universityId: loan.university_id,
      dueAt: new Date(loan.due_at),
    })),
    readyHolds: readyHolds.map((hold) => ({
      holdId: Number(hold.hold_id),
      title: hold.title,
      memberName: hold.member_name,
      universityId: hold.university_id,
      barcode: hold.ready_barcode ?? null,
      pickupBy: hold.pickup_by ? new Date(hold.pickup_by) : null,
    })),
  };
}
