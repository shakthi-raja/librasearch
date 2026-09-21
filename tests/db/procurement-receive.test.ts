import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { decideRequest, insertRequest } from "@/server/repositories/procurement";
import { receiveOrder } from "@/server/services/procurement";
import { insertBook, insertCategory, isbn13 } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;
let librarian: number;

beforeAll(async () => {
  db = await adminConnection();
  librarian = await insertUser(db, "LIBRARIAN");
});

afterAll(async () => {
  await db.end();
});

let seq = 0;
const nextIsbn = () => isbn13(`978${String(++seq).padStart(9, "0")}`);

const insertCataloguedBook = async () => {
  const n = ++seq;
  const title = `Database System Concepts ${n}`;
  const isbn = nextIsbn();
  const categoryId = await insertCategory(db);
  const bookId = await insertBook(db, categoryId, title);
  const [edition] = await db.query<ResultSetHeader>(
    `INSERT INTO editions (book_id, isbn13, edition_no, pub_year, page_count)
     VALUES (?, ?, 1, 2019, 1376)`,
    [bookId, isbn],
  );
  return { bookId, editionId: edition.insertId, title, isbn };
};

const createApprovedRequest = async (title: string, isbn13: string | null) => {
  const requestId = await withTransaction(pool("librarian"), (conn) =>
    insertRequest(
      conn,
      {
        title,
        author: "Silberschatz",
        isbn13: isbn13 ?? "",
        quantity: 2,
        reason: "Course text for the DBMS core.",
      },
      librarian,
    ),
  );
  await withTransaction(pool("librarian"), (conn) =>
    decideRequest(conn, { requestId, decision: "APPROVED", note: null }, librarian),
  );
  return requestId;
};

const copiesFor = async (editionId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT copy_id, accession_no, barcode, loan_policy, acquired_on FROM copies WHERE edition_id = ?",
    [editionId],
  );
  return rows;
};

const requestRow = async (requestId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT status, vendor, received_at FROM purchase_requests WHERE request_id = ?",
    [requestId],
  );
  const found = rows[0];
  if (!found) throw new Error(`request ${requestId} not found`);
  return found;
};

const receive = (requestId: number, count = 2, vendor = "Campus Books") =>
  receiveOrder({ requestId, vendor, rack: "CS-04", shelf: "S1", count }, librarian);

describe("receiveOrder", () => {
  it("adds shelf copies to the matched edition and closes the request", async () => {
    const { editionId, title, isbn } = await insertCataloguedBook();
    const requestId = await createApprovedRequest(title, isbn);

    const received = await receive(requestId);

    expect(received).toBe(2);
    const copies = await copiesFor(editionId);
    expect(copies).toHaveLength(2);
    for (const copy of copies) {
      expect(copy.loan_policy).toBe("REGULAR");
      expect(String(copy.accession_no)).toMatch(/^ACC-\d{4}-\d{5}$/);
      expect(String(copy.barcode)).toMatch(/^LS\d{8}$/);
    }
    expect(await requestRow(requestId)).toMatchObject({
      status: "RECEIVED",
      vendor: "Campus Books",
    });
    expect((await requestRow(requestId)).received_at).not.toBeNull();
  });

  it("falls back to an exact title match when the ISBN is new", async () => {
    const { editionId, title } = await insertCataloguedBook();
    const requestId = await createApprovedRequest(title, nextIsbn());

    await receive(requestId, 1);

    expect(await copiesFor(editionId)).toHaveLength(1);
  });

  it("refuses a book that is not in the catalogue yet", async () => {
    const requestId = await createApprovedRequest("A title nobody owns", nextIsbn());

    await expect(receive(requestId)).rejects.toThrow(/add that book to the catalogue/i);
    expect((await requestRow(requestId)).status).toBe("APPROVED");
  });

  it("refuses a request that has not been approved", async () => {
    const requestId = await withTransaction(pool("librarian"), (conn) =>
      insertRequest(
        conn,
        {
          title: "Some new book",
          author: null,
          isbn13: "",
          quantity: 1,
          reason: "Please buy it.",
        },
        librarian,
      ),
    );

    await expect(receive(requestId)).rejects.toThrow(/only an approved request/i);
  });

  it("cannot receive the same order twice", async () => {
    const { title, isbn } = await insertCataloguedBook();
    const requestId = await createApprovedRequest(title, isbn);
    await receive(requestId);

    await expect(receive(requestId)).rejects.toThrow(/only an approved request/i);
  });
});
