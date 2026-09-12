import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { mapDbError } from "@/server/db/errors";
import { pool } from "@/server/db/pool";
import { AppError } from "@/server/http/errors";
import { memberHoldForBook, memberHolds, staffHolds } from "@/server/repositories/holds";

type Role = "STUDENT" | "FACULTY" | "LIBRARIAN";

const account = (role: Role) =>
  role === "FACULTY" ? "faculty" : role === "STUDENT" ? "student" : "librarian";

export function getMemberHolds(userId: number, role: Role) {
  return memberHolds(pool(account(role)), userId);
}

export function getMemberHoldForBook(bookId: number, userId: number, role: Role) {
  return memberHoldForBook(pool(account(role)), bookId, userId);
}

export function getStaffHolds() {
  return staffHolds(pool("librarian"));
}

export async function placeHold(input: { bookId: number; memberId: number; role: Role }) {
  const connection = await pool(account(input.role)).getConnection();
  try {
    await connection.query("CALL sp_place_hold(?, ?, @new_hold)", [input.bookId, input.memberId]);
    const [rows] = await connection.query<RowDataPacket[]>("SELECT @new_hold AS hold_id");
    const holdId = Number((rows[0] as { hold_id: number | null } | undefined)?.hold_id);
    if (!Number.isInteger(holdId) || holdId <= 0) {
      throw new AppError("INTERNAL", "The hold was not created.");
    }
    return holdId;
  } catch (error) {
    throw mapDbError(error);
  } finally {
    connection.release();
  }
}

export async function cancelHold(input: { holdId: number; actorId: number; role: Role }) {
  const connection = await pool(account(input.role)).getConnection();
  try {
    await connection.query("CALL sp_cancel_hold(?, ?)", [input.holdId, input.actorId]);
  } catch (error) {
    throw mapDbError(error);
  } finally {
    connection.release();
  }
}
