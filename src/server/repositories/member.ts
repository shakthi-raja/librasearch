import "server-only";
import type { Pool, RowDataPacket } from "mysql2/promise";
import type { MemberLoan, MemberOverview } from "@/lib/circulation/types";
import type { PeriodRule } from "@/lib/format";

type OverviewRow = RowDataPacket & {
  user_id: number;
  university_id: string;
  full_name: string;
  role_name: string;
  max_loans: number;
  max_renewals: number;
  loan_days: number;
  active_loans: number;
  unpaid_fines: string;
};

type LoanRow = RowDataPacket & {
  loan_id: number;
  title: string;
  authors: string | null;
  edition_no: number;
  barcode: string;
  rack_code: string;
  shelf_code: string;
  issued_at: Date;
  due_at: Date;
  renew_count: number;
  days_overdue: number;
  fine_due: string;
  period_rule: PeriodRule;
};

export async function memberOverview(db: Pool, userId: number) {
  const [rows] = await db.query<OverviewRow[]>(
    `SELECT user_id, university_id, full_name, role_name, max_loans, max_renewals,
            loan_days, active_loans, unpaid_fines
       FROM v_member_overview
      WHERE user_id = ?`,
    [userId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    userId: Number(row.user_id),
    universityId: row.university_id,
    fullName: row.full_name,
    role: row.role_name as MemberOverview["role"],
    maxLoans: Number(row.max_loans),
    maxRenewals: Number(row.max_renewals),
    loanDays: Number(row.loan_days),
    activeLoans: Number(row.active_loans),
    unpaidFines: String(row.unpaid_fines),
  } satisfies MemberOverview;
}

export async function memberLoans(db: Pool, userId: number) {
  const [rows] = await db.query<LoanRow[]>(
    `SELECT loan_id, title, authors, edition_no, barcode, rack_code, shelf_code,
            issued_at, due_at, renew_count, days_overdue, fine_due, period_rule
       FROM v_member_loans
      WHERE member_id = ?
        AND returned_at IS NULL
        AND end_reason IS NULL
      ORDER BY due_at`,
    [userId],
  );
  return rows.map(
    (row) =>
      ({
        loanId: Number(row.loan_id),
        title: row.title,
        authors: row.authors ?? "",
        editionNo: Number(row.edition_no),
        barcode: row.barcode,
        rack: row.rack_code,
        shelf: row.shelf_code,
        issuedAt: row.issued_at,
        dueAt: row.due_at,
        renewCount: Number(row.renew_count),
        daysOverdue: Number(row.days_overdue),
        fineDue: String(row.fine_due),
        periodRule: row.period_rule,
      }) satisfies MemberLoan,
  );
}
