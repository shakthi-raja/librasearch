import type { PeriodRule } from "@/lib/format";

export type MemberSummary = {
  userId: number;
  universityId: string;
  fullName: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "LIBRARIAN";
  status: "ACTIVE" | "SUSPENDED" | "GRADUATED";
  activeLoans: number;
  maxLoans: number;
  unpaidFines: string;
};

export type CopySummary = {
  copyId: number;
  barcode: string;
  status: string;
  loanPolicy: string;
  rack: string;
  shelf: string;
  editionId: number;
  editionNo: number;
  isbn13: string;
  bookId: number;
  title: string;
  subtitle: string | null;
  authors: string;
};

export type ReceiptFine = {
  amount: string;
  daysOverdue: number;
  status: string;
};

export type ReceiptHold = {
  memberName: string;
  pickupBy: string;
};

export type DeskReceipt = {
  kind: "ISSUE" | "RETURN";
  loanId: number;
  member: MemberSummary;
  copy: CopySummary;
  issuedAt: string;
  dueAt: string;
  returnedAt: string | null;
  periodRule: PeriodRule;
  fine: ReceiptFine | null;
  nextHold: ReceiptHold | null;
};

export type DeskPolicy = {
  regularLoanDays: number;
  busyLoanDays: number;
  busyWaits: number;
  shortLoanDays: number;
  finePerDay: string;
  fineCap: string;
  holdExpiryHours: number;
};

export type DeskActivity = {
  loanId: number;
  title: string;
  memberName: string;
  barcode: string;
  issuedAt: string;
  returnedAt: string | null;
};

export type MemberOverview = {
  userId: number;
  universityId: string;
  fullName: string;
  role: "STUDENT" | "FACULTY" | "LIBRARIAN";
  maxLoans: number;
  maxRenewals: number;
  loanDays: number;
  activeLoans: number;
  unpaidFines: string;
};

export type MemberLoan = {
  loanId: number;
  title: string;
  authors: string;
  editionNo: number;
  barcode: string;
  rack: string;
  shelf: string;
  issuedAt: Date;
  dueAt: Date;
  renewCount: number;
  daysOverdue: number;
  fineDue: string;
  periodRule: PeriodRule;
};
