import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import type { DeskActivity, DeskPolicy, DeskReceipt } from "@/lib/circulation/types";
import { mapDbError } from "@/server/db/errors";
import { pool } from "@/server/db/pool";
import { AppError } from "@/server/http/errors";
import { publishLive } from "@/server/live";
import { log } from "@/server/log";
import {
  deskPolicy,
  findCopy,
  findFine,
  findLoan,
  findMember,
  findNextHold,
  recentActivity,
} from "@/server/repositories/circulation";

const db = () => pool("librarian");

async function callIssue(barcode: string, memberId: number, actorId: number) {
  const connection = await db().getConnection();
  try {
    await connection.query("CALL sp_issue_copy(?, ?, ?, @issued_loan)", [
      barcode,
      memberId,
      actorId,
    ]);
    const [rows] = await connection.query<RowDataPacket[]>("SELECT @issued_loan AS loan_id");
    const loanId = Number((rows[0] as { loan_id: number | null } | undefined)?.loan_id);
    if (!Number.isInteger(loanId) || loanId <= 0) {
      throw new AppError("INTERNAL", "The desk did not return a loan.");
    }
    return loanId;
  } catch (error) {
    throw mapDbError(error);
  } finally {
    connection.release();
  }
}

async function callReturn(barcode: string, actorId: number) {
  const connection = await db().getConnection();
  try {
    await connection.query("CALL sp_return_copy(?, ?, @returned_loan, @returned_fine)", [
      barcode,
      actorId,
    ]);
    const [rows] = await connection.query<RowDataPacket[]>("SELECT @returned_loan AS loan_id");
    const loanId = Number((rows[0] as { loan_id: number | null } | undefined)?.loan_id);
    if (!Number.isInteger(loanId) || loanId <= 0) {
      throw new AppError("INTERNAL", "The desk did not return a loan.");
    }
    return loanId;
  } catch (error) {
    throw mapDbError(error);
  } finally {
    connection.release();
  }
}

async function receipt(loanId: number, kind: DeskReceipt["kind"]): Promise<DeskReceipt> {
  const loan = await findLoan(db(), loanId);
  if (!loan) throw new AppError("INTERNAL", "The loan could not be read back.");

  const fine = kind === "RETURN" ? await findFine(db(), loanId) : null;
  const hold = kind === "RETURN" ? await findNextHold(db(), loan.copy.copyId) : null;

  return {
    kind,
    loanId: loan.loanId,
    member: loan.member,
    copy: loan.copy,
    issuedAt: loan.issuedAt.toISOString(),
    dueAt: loan.dueAt.toISOString(),
    returnedAt: loan.returnedAt ? loan.returnedAt.toISOString() : null,
    periodRule: loan.periodRule,
    fine,
    nextHold: hold ? { memberName: hold.memberName, pickupBy: hold.pickupBy.toISOString() } : null,
  };
}

export async function issueCopy(input: {
  memberIdentifier: string;
  barcode: string;
  actorId: number;
}): Promise<DeskReceipt> {
  const member = await findMember(db(), input.memberIdentifier);
  if (!member) {
    throw new AppError("NOT_FOUND", "No member has that university ID or email.");
  }
  if (member.role === "LIBRARIAN") {
    throw new AppError(
      "FORBIDDEN",
      "Staff accounts do not borrow. Use a student or faculty member.",
    );
  }

  const copy = await findCopy(db(), input.barcode);
  if (!copy) throw new AppError("NOT_FOUND", "No copy has that barcode.");

  const loanId = await callIssue(input.barcode, member.userId, input.actorId);
  return receipt(loanId, "ISSUE");
}

export async function returnCopy(input: {
  barcode: string;
  actorId: number;
}): Promise<DeskReceipt> {
  const copy = await findCopy(db(), input.barcode);
  if (!copy) throw new AppError("NOT_FOUND", "No copy has that barcode.");

  const loanId = await callReturn(input.barcode, input.actorId);
  await tellHoldReady(copy.copyId).catch((error: unknown) =>
    log.warn({ err: error }, "hold-ready notice not sent"),
  );
  return receipt(loanId, "RETURN");
}

/**
 * When a return fills a hold, the member waiting for it gets a notice and,
 * if they have LibraSearch open, an alert straight away.
 */
async function tellHoldReady(copyId: number) {
  const [rows] = await db().query<RowDataPacket[]>(
    `SELECT h.member_id, h.pickup_by, b.title
       FROM holds h JOIN books b ON b.book_id = h.book_id
      WHERE h.ready_copy_id = ? AND h.status = 'READY' AND h.ready_at >= NOW(3) - INTERVAL 1 MINUTE
      ORDER BY h.ready_at DESC LIMIT 1`,
    [copyId],
  );
  const hold = rows[0];
  if (!hold) return;
  const pickupBy = new Date(hold.pickup_by).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const event = {
    type: "hold-ready" as const,
    title: "Your hold is ready",
    body: `${String(hold.title)} is waiting for you on the hold shelf until ${pickupBy}.`,
    link: "/student",
  };
  await db().query(
    "INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, 'HOLD_READY', ?, ?, ?)",
    [Number(hold.member_id), event.title, event.body, event.link],
  );
  await publishLive({ userId: Number(hold.member_id) }, event);
}

type RenewalRole = "STUDENT" | "FACULTY" | "LIBRARIAN";

export async function renewLoan(input: {
  loanId: number;
  actorId: number;
  role: RenewalRole;
}): Promise<Date> {
  const account =
    input.role === "STUDENT" ? "student" : input.role === "FACULTY" ? "faculty" : "librarian";
  const connection = await pool(account).getConnection();
  try {
    await connection.query("CALL sp_renew_loan(?, ?, @renewed_due)", [input.loanId, input.actorId]);
    const [rows] = await connection.query<RowDataPacket[]>("SELECT @renewed_due AS due_at");
    const raw = rows[0]?.due_at;
    if (raw == null) throw new AppError("INTERNAL", "The renewal did not return a due date.");
    return new Date(`${String(raw).replace(" ", "T")}Z`);
  } catch (error) {
    throw mapDbError(error);
  } finally {
    connection.release();
  }
}

export function getDeskPolicy(): Promise<DeskPolicy> {
  return deskPolicy(db());
}

export function getRecentActivity(limit?: number): Promise<DeskActivity[]> {
  return recentActivity(db(), limit);
}
