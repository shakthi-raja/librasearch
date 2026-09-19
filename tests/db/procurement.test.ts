import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { decideRequest, insertRequest } from "@/server/repositories/procurement";
import { procurementQueue } from "@/server/services/procurement";
import { insertBook, insertCategory, insertEdition } from "../support/catalogue";
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

const request = {
  title: "Database System Concepts",
  author: "Silberschatz",
  isbn13: "9780078022159",
  quantity: 2,
  reason: "The course text for the DBMS core.",
};

const createRequest = () =>
  withTransaction(pool("librarian"), (conn) => insertRequest(conn, request, librarian));

const decide = (requestId: number, decision: "APPROVED" | "REJECTED", note?: string) =>
  withTransaction(pool("librarian"), (conn) =>
    decideRequest(conn, { requestId, decision, note: note ?? null }, librarian),
  );

const row = async (requestId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT request_id, title, status, reviewed_by, reviewed_at, review_note
       FROM purchase_requests WHERE request_id = ?`,
    [requestId],
  );
  const found = rows[0];
  if (!found) throw new Error(`request ${requestId} not found`);
  return found;
};

describe("procurementQueue", () => {
  it("lists a pending request with its requester and any close catalogue match", async () => {
    const categoryId = await insertCategory(db);
    const bookId = await insertBook(db, categoryId, "Database System Concepts");
    await insertEdition(db, bookId);

    const requestId = await createRequest();
    const { pending } = await procurementQueue();
    const found = pending.find((item) => item.requestId === requestId);

    expect(found).toMatchObject({ title: request.title, quantity: 2, status: "PENDING" });
    expect(found?.requester).toBeTruthy();
    expect(found?.duplicates.some((duplicate) => duplicate.bookId === bookId)).toBe(true);
  });

  it("drops the duplicate hints once the request is decided", async () => {
    const requestId = await createRequest();
    await decide(requestId, "APPROVED", "Order two copies.");

    const { pending, decided } = await procurementQueue();
    expect(pending.some((item) => item.requestId === requestId)).toBe(false);
    expect(decided.some((item) => item.requestId === requestId)).toBe(true);
  });
});

describe("decideRequest", () => {
  it("records who approved a request and when", async () => {
    const requestId = await createRequest();
    await decide(requestId, "APPROVED", "On the reading list.");

    expect(await row(requestId)).toMatchObject({
      status: "APPROVED",
      reviewed_by: librarian,
      review_note: "On the reading list.",
    });
    expect((await row(requestId)).reviewed_at).not.toBeNull();
  });

  it("refuses a rejection without a reason", async () => {
    const requestId = await createRequest();
    await expect(decide(requestId, "REJECTED")).rejects.toThrow(/why the request was rejected/i);
    expect((await row(requestId)).status).toBe("PENDING");
  });

  it("keeps the rejection note", async () => {
    const requestId = await createRequest();
    await decide(requestId, "REJECTED", "We already hold three copies.");

    expect(await row(requestId)).toMatchObject({
      status: "REJECTED",
      review_note: "We already hold three copies.",
    });
  });

  it("does not decide the same request twice", async () => {
    const requestId = await createRequest();
    await decide(requestId, "APPROVED");
    await expect(decide(requestId, "REJECTED", "Changed my mind.")).rejects.toThrow(
      /already been decided/i,
    );
    expect((await row(requestId)).status).toBe("APPROVED");
  });
});
