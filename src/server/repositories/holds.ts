import "server-only";
import type { Pool, RowDataPacket } from "mysql2/promise";
import type { HoldStatus, MemberHold, StaffHold } from "@/lib/circulation/types";

type HoldRow = RowDataPacket & {
  hold_id: number;
  book_id: number;
  status: string;
  placed_at: Date;
  ready_at: Date | null;
  pickup_by: Date | null;
  queue_position: number;
  title: string;
  authors: string | null;
  member_name: string;
  university_id: string;
  ready_barcode: string | null;
  ready_rack: string | null;
};

const SELECT = `
  SELECT hold_id, book_id, status, placed_at, ready_at, pickup_by, queue_position,
         title, authors, member_name, university_id, ready_barcode, ready_rack
    FROM v_hold_queue`;

const toHold = (row: HoldRow): MemberHold => ({
  holdId: Number(row.hold_id),
  bookId: Number(row.book_id),
  title: row.title,
  authors: row.authors ?? "",
  status: row.status as HoldStatus,
  queuePosition: Number(row.queue_position),
  placedAt: row.placed_at,
  readyAt: row.ready_at,
  pickupBy: row.pickup_by,
  readyBarcode: row.ready_barcode,
  readyRack: row.ready_rack,
});

export async function memberHolds(db: Pool, userId: number) {
  const [rows] = await db.query<HoldRow[]>(
    `${SELECT} WHERE member_id = ? ORDER BY queue_position`,
    [userId],
  );
  return rows.map(toHold);
}

export async function memberHoldForBook(db: Pool, bookId: number, userId: number) {
  const [rows] = await db.query<HoldRow[]>(
    `${SELECT} WHERE book_id = ? AND member_id = ? LIMIT 1`,
    [bookId, userId],
  );
  const row = rows[0];
  return row ? toHold(row) : null;
}

export async function staffHolds(db: Pool) {
  const [rows] = await db.query<HoldRow[]>(`${SELECT} ORDER BY title, queue_position`);
  return rows.map(
    (row) =>
      ({
        ...toHold(row),
        memberName: row.member_name,
        universityId: row.university_id,
      }) satisfies StaffHold,
  );
}
