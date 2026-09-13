import "server-only";
import type { Pool, RowDataPacket } from "mysql2/promise";
import type {
  CopySummary,
  DeskActivity,
  DeskPolicy,
  MemberSummary,
  ReceiptFine,
} from "@/lib/circulation/types";
import type { PeriodRule } from "@/lib/format";

type MemberRow = RowDataPacket & {
  user_id: number;
  university_id: string;
  full_name: string;
  email: string;
  status: string;
  role_name: string;
  max_loans: number;
  active_loans: number;
  unpaid_fines: string;
};

type CopyRow = RowDataPacket & {
  copy_id: number;
  barcode: string;
  status: string;
  loan_policy: string;
  rack_code: string;
  shelf_code: string;
  edition_id: number;
  edition_no: number;
  isbn13: string;
  book_id: number;
  title: string;
  subtitle: string | null;
  authors: string | null;
};

type LoanRow = MemberRow &
  CopyRow & {
    loan_id: number;
    issued_at: Date;
    due_at: Date;
    returned_at: Date | null;
    period_rule: PeriodRule;
  };

type FineRow = RowDataPacket & {
  amount: string;
  days_overdue: number;
  status: string;
};

const toMember = (row: MemberRow): MemberSummary => ({
  userId: Number(row.user_id),
  universityId: row.university_id,
  fullName: row.full_name,
  email: row.email,
  role: row.role_name as MemberSummary["role"],
  status: row.status as MemberSummary["status"],
  activeLoans: Number(row.active_loans),
  maxLoans: Number(row.max_loans),
  unpaidFines: String(row.unpaid_fines),
});

const toCopy = (row: CopyRow): CopySummary => ({
  copyId: Number(row.copy_id),
  barcode: row.barcode,
  status: row.status,
  loanPolicy: row.loan_policy,
  rack: row.rack_code,
  shelf: row.shelf_code,
  editionId: Number(row.edition_id),
  editionNo: Number(row.edition_no),
  isbn13: row.isbn13,
  bookId: Number(row.book_id),
  title: row.title,
  subtitle: row.subtitle,
  authors: row.authors ?? "",
});

const MEMBER_SELECT = `
  SELECT u.user_id, u.university_id, u.full_name, u.email, u.status, r.role_name, r.max_loans,
         (SELECT COUNT(*) FROM loans l
           WHERE l.member_id = u.user_id AND l.returned_at IS NULL AND l.end_reason IS NULL) AS active_loans,
         (SELECT COALESCE(SUM(f.amount), 0)
            FROM fines f JOIN loans l ON l.loan_id = f.loan_id
           WHERE l.member_id = u.user_id AND f.status = 'UNPAID') AS unpaid_fines
    FROM users u
    JOIN roles r ON r.role_id = u.role_id`;

export async function findMember(db: Pool, identifier: string) {
  const [rows] = await db.query<MemberRow[]>(
    `${MEMBER_SELECT}
     WHERE u.university_id = UPPER(?) OR u.email = LOWER(?)
     LIMIT 1`,
    [identifier, identifier],
  );
  const row = rows[0];
  return row ? toMember(row) : null;
}

const COPY_SELECT = `
  SELECT c.copy_id, c.barcode, c.status, c.loan_policy, c.rack_code, c.shelf_code,
         e.edition_id, e.edition_no, e.isbn13,
         b.book_id, b.title, b.subtitle,
         (SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
            FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
           WHERE ba.book_id = b.book_id) AS authors
    FROM copies c
    JOIN editions e ON e.edition_id = c.edition_id
    JOIN books b ON b.book_id = e.book_id`;

export async function findCopy(db: Pool, barcode: string) {
  const [rows] = await db.query<CopyRow[]>(`${COPY_SELECT} WHERE c.barcode = ?`, [barcode]);
  const row = rows[0];
  return row ? toCopy(row) : null;
}

export type LoanRecord = {
  loanId: number;
  issuedAt: Date;
  dueAt: Date;
  returnedAt: Date | null;
  periodRule: PeriodRule;
  member: MemberSummary;
  copy: CopySummary;
};

export async function findLoan(db: Pool, loanId: number) {
  const [rows] = await db.query<LoanRow[]>(
    `SELECT l.loan_id, l.issued_at, l.due_at, l.returned_at, l.period_rule,
            u.user_id, u.university_id, u.full_name, u.email, u.status, r.role_name, r.max_loans,
            (SELECT COUNT(*) FROM loans x
              WHERE x.member_id = u.user_id AND x.returned_at IS NULL AND x.end_reason IS NULL) AS active_loans,
            (SELECT COALESCE(SUM(f.amount), 0)
               FROM fines f JOIN loans x ON x.loan_id = f.loan_id
              WHERE x.member_id = u.user_id AND f.status = 'UNPAID') AS unpaid_fines,
            c.copy_id, c.barcode, c.status, c.loan_policy, c.rack_code, c.shelf_code,
            e.edition_id, e.edition_no, e.isbn13,
            b.book_id, b.title, b.subtitle,
            (SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
               FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
              WHERE ba.book_id = b.book_id) AS authors
       FROM loans l
       JOIN users u ON u.user_id = l.member_id
       JOIN roles r ON r.role_id = u.role_id
       JOIN copies c ON c.copy_id = l.copy_id
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
      WHERE l.loan_id = ?`,
    [loanId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    loanId: Number(row.loan_id),
    issuedAt: row.issued_at,
    dueAt: row.due_at,
    returnedAt: row.returned_at,
    periodRule: row.period_rule,
    member: toMember(row),
    copy: toCopy(row),
  } satisfies LoanRecord;
}

export async function findFine(db: Pool, loanId: number) {
  const [rows] = await db.query<FineRow[]>(
    "SELECT amount, days_overdue, status FROM fines WHERE loan_id = ?",
    [loanId],
  );
  const row = rows[0];
  return row
    ? ({
        amount: String(row.amount),
        daysOverdue: Number(row.days_overdue),
        status: row.status,
      } satisfies ReceiptFine)
    : null;
}

export async function findNextHold(db: Pool, copyId: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT u.full_name, h.pickup_by
       FROM holds h JOIN users u ON u.user_id = h.member_id
      WHERE h.ready_copy_id = ? AND h.status = 'READY'
      LIMIT 1`,
    [copyId],
  );
  const row = rows[0] as { full_name: string; pickup_by: Date } | undefined;
  return row ? { memberName: row.full_name, pickupBy: row.pickup_by } : null;
}

export async function recentActivity(db: Pool, limit = 8) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT l.loan_id, b.title, u.full_name, c.barcode, l.issued_at, l.returned_at
       FROM loans l
       JOIN users u ON u.user_id = l.member_id
       JOIN copies c ON c.copy_id = l.copy_id
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
      ORDER BY COALESCE(l.returned_at, l.issued_at) DESC, l.loan_id DESC
      LIMIT ?`,
    [limit],
  );
  return rows.map(
    (row) =>
      ({
        loanId: Number(row.loan_id),
        title: row.title,
        memberName: row.full_name,
        barcode: row.barcode,
        issuedAt: (row.issued_at as Date).toISOString(),
        returnedAt: row.returned_at ? (row.returned_at as Date).toISOString() : null,
      }) satisfies DeskActivity,
  );
}

export async function deskPolicy(db: Pool) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT s.fine_per_day, s.fine_cap, s.hold_expiry_hours, s.busy_loan_days, s.waits_for_busy_loan, s.short_loan_days,
            (SELECT r.loan_days FROM roles r WHERE r.role_name = 'STUDENT') AS regular_loan_days
       FROM library_settings s
      WHERE s.setting_id = 1`,
  );
  const row = rows[0] as
    | {
        fine_per_day: string;
        fine_cap: string;
        hold_expiry_hours: number;
        busy_loan_days: number;
        waits_for_busy_loan: number;
        short_loan_days: number;
        regular_loan_days: number;
      }
    | undefined;
  if (!row) throw new Error("library_settings is missing");
  return {
    regularLoanDays: Number(row.regular_loan_days),
    busyLoanDays: Number(row.busy_loan_days),
    busyWaits: Number(row.waits_for_busy_loan),
    shortLoanDays: Number(row.short_loan_days),
    finePerDay: String(row.fine_per_day),
    fineCap: String(row.fine_cap),
    holdExpiryHours: Number(row.hold_expiry_hours),
  } satisfies DeskPolicy;
}
