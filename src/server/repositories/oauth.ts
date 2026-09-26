import "server-only";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import type { AccountStatus, RoleName } from "./auth";

export type LinkedMember = { userId: number; role: RoleName; status: AccountStatus };

export type GoogleLink = { email: string; linkedAt: Date; lastUsedAt: Date | null };

const MEMBER_SELECT = `
  SELECT u.user_id, u.status, r.role_name
    FROM users u
    JOIN roles r ON r.role_id = u.role_id`;

const toMember = (row: RowDataPacket | undefined): LinkedMember | null =>
  row
    ? {
        userId: Number(row.user_id),
        role: row.role_name as RoleName,
        status: row.status as AccountStatus,
      }
    : null;

/** The member a Google subject is already linked to. */
export async function memberBySubject(db: Pool, subject: string): Promise<LinkedMember | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `${MEMBER_SELECT}
       JOIN oauth_accounts o ON o.user_id = u.user_id
      WHERE o.provider = 'GOOGLE' AND o.subject = ?`,
    [subject],
  );
  return toMember(rows[0]);
}

export async function memberByEmail(db: Pool, email: string): Promise<LinkedMember | null> {
  const [rows] = await db.execute<RowDataPacket[]>(`${MEMBER_SELECT} WHERE u.email = ?`, [email]);
  return toMember(rows[0]);
}

export async function googleLinkFor(db: Pool, userId: number): Promise<GoogleLink | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT email, linked_at, last_used_at FROM oauth_accounts
      WHERE user_id = ? AND provider = 'GOOGLE'`,
    [userId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    email: String(row.email),
    linkedAt: new Date(row.linked_at),
    lastUsedAt: row.last_used_at === null ? null : new Date(row.last_used_at),
  };
}

export async function insertGoogleLink(
  db: Pool | PoolConnection,
  userId: number,
  subject: string,
  email: string,
) {
  await db.execute(
    "INSERT INTO oauth_accounts (user_id, provider, subject, email) VALUES (?, 'GOOGLE', ?, ?)",
    [userId, subject, email],
  );
}

export async function touchGoogleLink(db: Pool, subject: string) {
  await db.execute(
    "UPDATE oauth_accounts SET last_used_at = UTC_TIMESTAMP(3) WHERE provider = 'GOOGLE' AND subject = ?",
    [subject],
  );
}

export async function deleteGoogleLink(db: Pool, userId: number): Promise<boolean> {
  const [result] = await db.execute(
    "DELETE FROM oauth_accounts WHERE user_id = ? AND provider = 'GOOGLE'",
    [userId],
  );
  return (result as { affectedRows: number }).affectedRows > 0;
}
