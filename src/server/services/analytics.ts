import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";

export type Analytics = {
  loans30: number;
  active: number;
  overdue: number;
  holdsWaiting: number;
  unpaid: { count: number; amount: number };
  members: number;
  daily: { day: string; loans: number }[];
  topBooks: { bookId: number; title: string; authors: string; loans: number }[];
  byCategory: { name: string; loans: number }[];
};

const DAY = 86_400_000;

/** Zero-fills the last two weeks so the chart has a bar for quiet days. */
function fillDays(rows: RowDataPacket[], days: number): { day: string; loans: number }[] {
  const counts = new Map(rows.map((row) => [String(row.day), Number(row.loans)] as const));
  const out: { day: string; loans: number }[] = [];
  const today = Date.now();
  for (let offset = days - 1; offset >= 0; offset--) {
    const day = new Date(today - offset * DAY).toISOString().slice(0, 10);
    out.push({ day, loans: counts.get(day) ?? 0 });
  }
  return out;
}

export async function libraryAnalytics(): Promise<Analytics> {
  const db = pool("librarian");
  const [kpis] = await db.query<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(*) FROM loans WHERE issued_at >= NOW() - INTERVAL 30 DAY) AS loans_30,
       (SELECT COUNT(*) FROM loans
         WHERE returned_at IS NULL AND end_reason IS NULL) AS active,
       (SELECT COUNT(*) FROM loans
         WHERE returned_at IS NULL AND end_reason IS NULL AND due_at < NOW()) AS overdue,
       (SELECT COUNT(*) FROM holds WHERE status = 'WAITING') AS holds_waiting,
       (SELECT COUNT(*) FROM fines WHERE status = 'UNPAID') AS unpaid_count,
       (SELECT COALESCE(SUM(amount), 0) FROM fines WHERE status = 'UNPAID') AS unpaid_amount,
       (SELECT COUNT(*) FROM users WHERE status = 'ACTIVE') AS members`,
  );
  const kpi = kpis[0] ?? ({} as RowDataPacket);

  const [daily] = await db.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(issued_at, '%Y-%m-%d') AS day, COUNT(*) AS loans
       FROM loans
      WHERE issued_at >= CURDATE() - INTERVAL 13 DAY
      GROUP BY DATE_FORMAT(issued_at, '%Y-%m-%d')`,
  );

  const [topBooks] = await db.query<RowDataPacket[]>(
    `SELECT b.book_id, b.title,
            (SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
               FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
              WHERE ba.book_id = b.book_id) AS authors,
            COUNT(*) AS loans
       FROM loans l
       JOIN copies c ON c.copy_id = l.copy_id
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
      WHERE l.issued_at >= NOW() - INTERVAL 30 DAY
      GROUP BY b.book_id, b.title
      ORDER BY loans DESC, b.title
      LIMIT 5`,
  );

  const [byCategory] = await db.query<RowDataPacket[]>(
    `SELECT cat.name, COUNT(*) AS loans
       FROM loans l
       JOIN copies c ON c.copy_id = l.copy_id
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
       JOIN categories cat ON cat.category_id = b.category_id
      WHERE l.issued_at >= NOW() - INTERVAL 30 DAY
      GROUP BY cat.category_id, cat.name
      ORDER BY loans DESC
      LIMIT 6`,
  );

  return {
    loans30: Number(kpi.loans_30 ?? 0),
    active: Number(kpi.active ?? 0),
    overdue: Number(kpi.overdue ?? 0),
    holdsWaiting: Number(kpi.holds_waiting ?? 0),
    unpaid: { count: Number(kpi.unpaid_count ?? 0), amount: Number(kpi.unpaid_amount ?? 0) },
    members: Number(kpi.members ?? 0),
    daily: fillDays(daily, 14),
    topBooks: topBooks.map((row) => ({
      bookId: Number(row.book_id),
      title: row.title,
      authors: row.authors ?? "",
      loans: Number(row.loans),
    })),
    byCategory: byCategory.map((row) => ({ name: row.name, loans: Number(row.loans) })),
  };
}
