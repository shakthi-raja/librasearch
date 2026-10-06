import "server-only";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { NoticeInput } from "@/lib/validation/notices";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { publishLive } from "@/server/live";

export type Notice = {
  id: number;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  readAt: string | null;
};

const memberPool = (role: "STUDENT" | "FACULTY" | "LIBRARIAN") =>
  pool(role === "FACULTY" ? "faculty" : "student");

export async function memberNotices(
  userId: number,
  role: "STUDENT" | "FACULTY" | "LIBRARIAN",
): Promise<{ unread: number; notices: Notice[] }> {
  const [rows] = await memberPool(role).query<RowDataPacket[]>(
    `SELECT notification_id, title, body, link, created_at, read_at
       FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC, notification_id DESC
      LIMIT 30`,
    [userId],
  );
  const notices = rows.map((row) => ({
    id: Number(row.notification_id),
    title: String(row.title),
    body: String(row.body),
    link: row.link === null ? null : String(row.link),
    createdAt: new Date(row.created_at).toISOString(),
    readAt: row.read_at === null ? null : new Date(row.read_at).toISOString(),
  }));
  return { unread: notices.filter((notice) => notice.readAt === null).length, notices };
}

export async function markNoticeRead(
  noticeId: number,
  userId: number,
  role: "STUDENT" | "FACULTY" | "LIBRARIAN",
): Promise<boolean> {
  const [result] = await memberPool(role).query<ResultSetHeader>(
    "UPDATE notifications SET read_at = NOW(3) WHERE notification_id = ? AND user_id = ? AND read_at IS NULL",
    [noticeId, userId],
  );
  return result.affectedRows === 1;
}

/** Writes one notice row per active member in the chosen audience. */
export async function sendNotice(input: NoticeInput, actorId: number): Promise<number> {
  const sent = await withTransaction(pool("librarian"), async (conn) => {
    await conn.query("SET @app_user_id = ?", [actorId]);
    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO notifications (user_id, type, title, body, link)
       SELECT u.user_id, 'SYSTEM', ?, ?, ?
         FROM users u
         JOIN roles r ON r.role_id = u.role_id
        WHERE u.status = 'ACTIVE'
          AND (? = 'BOTH' OR r.role_name = ?)`,
      [input.title, input.body, input.link, input.audience, input.audience],
    );
    return result.affectedRows;
  });
  const event = { type: "notice" as const, title: input.title, body: input.body, link: input.link };
  const roles = input.audience === "BOTH" ? (["STUDENT", "FACULTY"] as const) : [input.audience];
  await Promise.all(roles.map((role) => publishLive({ role }, event)));
  return sent;
}
