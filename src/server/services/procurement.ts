import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import {
  type CandidateBook,
  type DuplicateCandidate,
  findDuplicates,
} from "@/lib/procurement/duplicates";
import type { ReceiveInput } from "@/lib/validation/procurement";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { AppError } from "@/server/http/errors";
import { insertCopies } from "@/server/repositories/admin-catalog";

export type ProcurementRow = {
  requestId: number;
  title: string;
  author: string | null;
  isbn13: string | null;
  quantity: number;
  reason: string;
  status: string;
  note: string | null;
  requester: string;
  unit: string | null;
  createdAt: string;
  decidedAt: string | null;
  duplicates: DuplicateCandidate[];
};

export type ProcurementQueue = { pending: ProcurementRow[]; decided: ProcurementRow[] };

const CANDIDATE_SELECT = `
  SELECT b.book_id, b.title,
         (SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
            FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
           WHERE ba.book_id = b.book_id) AS authors,
         (SELECT e.isbn13 FROM editions e
           WHERE e.book_id = b.book_id ORDER BY e.edition_no DESC LIMIT 1) AS isbn13,
         (SELECT MAX(e.pub_year) FROM editions e WHERE e.book_id = b.book_id) AS latest_year
    FROM books b`;

const toCandidate = (row: RowDataPacket): CandidateBook => ({
  bookId: Number(row.book_id),
  title: String(row.title),
  authors: row.authors ?? "",
  isbn13: row.isbn13 ?? null,
  year: row.latest_year === null ? null : Number(row.latest_year),
});

/**
 * Every active book, plus any edition with the request's ISBN. The comparison
 * runs in JavaScript: a catalogue of this size does not need the ranking of a
 * full-text query, and the result does not drift with it.
 */
async function candidatesFor(
  db: ReturnType<typeof pool>,
  request: { isbn13: string | null },
): Promise<CandidateBook[]> {
  const byId = new Map<number, CandidateBook>();
  const add = (row: RowDataPacket) => byId.set(Number(row.book_id), toCandidate(row));

  const [rows] = await db.query<RowDataPacket[]>(`${CANDIDATE_SELECT} WHERE b.status = 'ACTIVE'`);
  rows.forEach(add);

  if (request.isbn13) {
    const [isbnRows] = await db.query<RowDataPacket[]>(
      `${CANDIDATE_SELECT} JOIN editions e ON e.book_id = b.book_id WHERE e.isbn13 = ? LIMIT 5`,
      [request.isbn13],
    );
    isbnRows.forEach(add);
  }
  return [...byId.values()];
}

export async function procurementQueue(): Promise<ProcurementQueue> {
  const db = pool("librarian");
  const [requests] = await db.query<RowDataPacket[]>(
    `SELECT r.request_id, r.title, r.author, r.isbn13, r.quantity, r.reason,
            r.status, r.review_note, r.created_at, r.reviewed_at,
            u.full_name AS requester,
            c.course_code, su.unit_no, su.title AS unit_title
       FROM purchase_requests r
       JOIN users u ON u.user_id = r.requested_by
       LEFT JOIN syllabus_units su ON su.unit_id = r.unit_id
       LEFT JOIN course_offerings o ON o.offering_id = su.offering_id
       LEFT JOIN courses c ON c.course_id = o.course_id
      ORDER BY r.created_at DESC, r.request_id DESC`,
  );
  const rows = await Promise.all(
    requests.map(async (row): Promise<ProcurementRow> => {
      const status = String(row.status);
      const duplicates =
        status === "PENDING"
          ? findDuplicates(
              { title: row.title, author: row.author, isbn13: row.isbn13 },
              await candidatesFor(db, {
                isbn13: row.isbn13 === null ? null : String(row.isbn13),
              }),
            )
          : [];
      return {
        requestId: Number(row.request_id),
        title: row.title,
        author: row.author,
        isbn13: row.isbn13,
        quantity: Number(row.quantity),
        reason: row.reason,
        status,
        note: row.review_note,
        requester: row.requester,
        unit: row.course_code ? `${row.course_code} · Unit ${row.unit_no}` : null,
        createdAt: new Date(row.created_at).toISOString(),
        decidedAt: row.reviewed_at === null ? null : new Date(row.reviewed_at).toISOString(),
        duplicates,
      };
    }),
  );

  return {
    pending: rows.filter((row) => row.status === "PENDING"),
    decided: rows.filter((row) => row.status !== "PENDING"),
  };
}

/** Turns an approved order into shelf copies and closes the request. */
export async function receiveOrder(input: ReceiveInput, actorId: number): Promise<number> {
  return withTransaction(pool("librarian"), async (conn) => {
    await conn.query("SET @app_user_id = ?", [actorId]);
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT request_id, title, isbn13, quantity, status
         FROM purchase_requests WHERE request_id = ? FOR UPDATE`,
      [input.requestId],
    );
    const request = rows[0];
    if (!request) throw new AppError("NOT_FOUND", "That request does not exist.");
    if (request.status !== "APPROVED" && request.status !== "ORDERED") {
      throw new AppError("CONFLICT", "Only an approved request can be received.");
    }

    let editionId: number | null = null;
    if (request.isbn13) {
      const [editions] = await conn.query<RowDataPacket[]>(
        `SELECT edition_id FROM editions WHERE isbn13 = ? ORDER BY edition_no DESC LIMIT 1`,
        [request.isbn13],
      );
      editionId = editions[0] ? Number(editions[0].edition_id) : null;
    }
    if (editionId === null) {
      const [books] = await conn.query<RowDataPacket[]>(
        `SELECT (SELECT e.edition_id FROM editions e
                  WHERE e.book_id = b.book_id ORDER BY e.edition_no DESC LIMIT 1) AS edition_id
           FROM books b
          WHERE b.status = 'ACTIVE' AND LOWER(b.title) = LOWER(?)
          LIMIT 1`,
        [request.title],
      );
      editionId = books[0]?.edition_id ? Number(books[0].edition_id) : null;
    }
    if (editionId === null) {
      throw new AppError(
        "BAD_REQUEST",
        "Add that book to the catalogue before receiving the order.",
      );
    }

    await insertCopies(conn, {
      editionId,
      rack: input.rack,
      shelf: input.shelf,
      count: input.count,
      loanPolicy: "REGULAR",
    });
    await conn.query(
      `UPDATE purchase_requests
          SET status = 'RECEIVED', received_at = NOW(3), vendor = ?,
              reviewed_by = COALESCE(reviewed_by, ?), reviewed_at = COALESCE(reviewed_at, NOW(3))
        WHERE request_id = ?`,
      [input.vendor, actorId, input.requestId],
    );
    return input.count;
  });
}
