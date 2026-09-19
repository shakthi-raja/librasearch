import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import {
  type CandidateBook,
  type DuplicateCandidate,
  findDuplicates,
} from "@/lib/procurement/duplicates";
import { pool } from "@/server/db/pool";

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

const CANDIDATE_BOOKS = `
  SELECT b.book_id, b.title,
         (SELECT GROUP_CONCAT(a.full_name ORDER BY ba.author_order SEPARATOR ', ')
            FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
           WHERE ba.book_id = b.book_id) AS authors,
         (SELECT e.isbn13 FROM editions e
           WHERE e.book_id = b.book_id ORDER BY e.edition_no DESC LIMIT 1) AS isbn13,
         (SELECT MAX(e.pub_year) FROM editions e WHERE e.book_id = b.book_id) AS latest_year
    FROM books b
   WHERE b.status = 'ACTIVE'
   ORDER BY b.book_id
   LIMIT 500`;

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
  const [books] = await db.query<RowDataPacket[]>(CANDIDATE_BOOKS);
  const catalogue: CandidateBook[] = books.map((book) => ({
    bookId: Number(book.book_id),
    title: book.title,
    authors: book.authors ?? "",
    isbn13: book.isbn13 ?? null,
    year: book.latest_year === null ? null : Number(book.latest_year),
  }));

  const rows = requests.map((row) => {
    const status = String(row.status);
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
      duplicates:
        status === "PENDING"
          ? findDuplicates({ title: row.title, author: row.author, isbn13: row.isbn13 }, catalogue)
          : [],
    } satisfies ProcurementRow;
  });

  return {
    pending: rows.filter((row) => row.status === "PENDING"),
    decided: rows.filter((row) => row.status !== "PENDING"),
  };
}
