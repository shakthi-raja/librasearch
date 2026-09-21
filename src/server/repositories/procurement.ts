import "server-only";
import type { PoolConnection, ResultSetHeader } from "mysql2/promise";
import type { DecisionInput, PurchaseRequestInput } from "@/lib/validation/procurement";
import { AppError } from "@/server/http/errors";

export async function insertRequest(
  conn: PoolConnection,
  input: PurchaseRequestInput,
  userId: number,
): Promise<number> {
  const [result] = await conn.query<ResultSetHeader>(
    `INSERT INTO purchase_requests (requested_by, title, author, isbn13, reason, quantity)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      input.title,
      input.author,
      input.isbn13 === "" ? null : input.isbn13,
      input.reason,
      input.quantity,
    ],
  );
  return result.insertId;
}

export async function decideRequest(
  conn: PoolConnection,
  input: DecisionInput,
  actorId: number,
): Promise<void> {
  if (input.decision === "REJECTED" && !input.note) {
    throw new AppError("BAD_REQUEST", "Say why the request was rejected.");
  }

  const [result] = await conn.query<ResultSetHeader>(
    `UPDATE purchase_requests
        SET status = ?, reviewed_by = ?, reviewed_at = NOW(3), review_note = ?
      WHERE request_id = ? AND status = 'PENDING'`,
    [input.decision, actorId, input.note, input.requestId],
  );
  if (result.affectedRows === 0) {
    throw new AppError("CONFLICT", "That request has already been decided.");
  }
}
