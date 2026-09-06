import "server-only";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type RoleName = "STUDENT" | "FACULTY" | "LIBRARIAN";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "GRADUATED";

export type Credential = {
  userId: number;
  role: RoleName;
  status: AccountStatus;
  passwordHash: string;
  lockedUntil: Date | null;
};

export type SessionRecord = {
  sessionId: number;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  user: {
    userId: number;
    role: RoleName;
    status: AccountStatus;
    fullName: string;
    email: string;
    universityId: string;
    mustChangePassword: boolean;
  };
};

const CREDENTIAL_SELECT = `
  SELECT u.user_id, u.status, u.password_hash, u.locked_until, r.role_name
    FROM users u
    JOIN roles r ON r.role_id = u.role_id`;

function toCredential(row: RowDataPacket | undefined): Credential | null {
  if (!row) return null;
  return {
    userId: Number(row.user_id),
    role: row.role_name as RoleName,
    status: row.status as AccountStatus,
    passwordHash: String(row.password_hash),
    lockedUntil: row.locked_until === null ? null : new Date(row.locked_until),
  };
}

export async function findCredential(db: Pool, identifier: string): Promise<Credential | null> {
  const column = identifier.includes("@") ? "u.email" : "u.university_id";
  const [rows] = await db.execute<RowDataPacket[]>(`${CREDENTIAL_SELECT} WHERE ${column} = ?`, [
    identifier,
  ]);
  return toCredential(rows[0]);
}

export async function findCredentialById(db: Pool, userId: number): Promise<Credential | null> {
  const [rows] = await db.execute<RowDataPacket[]>(`${CREDENTIAL_SELECT} WHERE u.user_id = ?`, [
    userId,
  ]);
  return toCredential(rows[0]);
}

export async function recordLogin(db: Pool, userId: number) {
  await db.execute(
    "UPDATE users SET last_login_at = UTC_TIMESTAMP(3), failed_logins = 0, locked_until = NULL WHERE user_id = ?",
    [userId],
  );
}

/**
 * Counts a failed password. The assignments run left to right, so the second
 * and third see the incremented count: the account locks on the Nth failure
 * and the counter starts again for the next window.
 */
export async function recordFailure(
  db: Pool,
  userId: number,
  failures: number,
  lockMinutes: number,
) {
  await db.execute(
    `UPDATE users
        SET failed_logins = failed_logins + 1,
            locked_until = IF(failed_logins >= ?, UTC_TIMESTAMP(3) + INTERVAL ? MINUTE, locked_until),
            failed_logins = IF(failed_logins >= ?, 0, failed_logins)
      WHERE user_id = ?`,
    [failures, lockMinutes, failures, userId],
  );
}

export async function replacePasswordHash(db: Pool, userId: number, passwordHash: string) {
  await db.execute("UPDATE users SET password_hash = ? WHERE user_id = ?", [passwordHash, userId]);
}

/** A real password change. Moving password_changed_at revokes every session in the database. */
export async function changePasswordHash(db: Pool, userId: number, passwordHash: string) {
  await db.execute(
    `UPDATE users
        SET password_hash = ?, password_changed_at = UTC_TIMESTAMP(3), must_change_password = FALSE
      WHERE user_id = ?`,
    [passwordHash, userId],
  );
}

export async function recordAttempt(
  db: Pool,
  identifier: string,
  ip: string | null,
  success: boolean,
) {
  await db.execute("INSERT INTO auth_attempts (identifier, ip, success) VALUES (?, ?, ?)", [
    identifier.slice(0, 254),
    ip,
    success,
  ]);
}

export async function insertSession(
  db: Pool,
  session: {
    userId: number;
    tokenHash: string;
    ip: string | null;
    userAgent: string | null;
    expiresAt: Date;
  },
) {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO auth_sessions (user_id, token_hash, ip, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      session.userId,
      session.tokenHash,
      session.ip,
      session.userAgent?.slice(0, 255) ?? null,
      session.expiresAt,
    ],
  );
  return result.insertId;
}

export async function findSession(db: Pool, tokenHash: string): Promise<SessionRecord | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT s.session_id, s.created_at, s.last_seen_at, s.expires_at, s.revoked_at,
            u.user_id, u.status, u.full_name, u.email, u.university_id, u.must_change_password,
            r.role_name
       FROM auth_sessions s
       JOIN users u ON u.user_id = s.user_id
       JOIN roles r ON r.role_id = u.role_id
      WHERE s.token_hash = ?`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    sessionId: Number(row.session_id),
    createdAt: new Date(row.created_at),
    lastSeenAt: new Date(row.last_seen_at),
    expiresAt: new Date(row.expires_at),
    revokedAt: row.revoked_at === null ? null : new Date(row.revoked_at),
    user: {
      userId: Number(row.user_id),
      role: row.role_name as RoleName,
      status: row.status as AccountStatus,
      fullName: String(row.full_name),
      email: String(row.email),
      universityId: String(row.university_id),
      mustChangePassword: Boolean(row.must_change_password),
    },
  };
}

export async function touchSession(db: Pool, sessionId: number, expiresAt: Date) {
  await db.execute(
    "UPDATE auth_sessions SET last_seen_at = UTC_TIMESTAMP(3), expires_at = ? WHERE session_id = ?",
    [expiresAt, sessionId],
  );
}

export async function revokeSession(db: Pool, tokenHash: string) {
  await db.execute(
    "UPDATE auth_sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE token_hash = ? AND revoked_at IS NULL",
    [tokenHash],
  );
}
