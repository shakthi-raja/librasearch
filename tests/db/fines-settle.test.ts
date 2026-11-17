import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePools, pool } from "@/server/db/pool";
import { settleFine } from "@/server/repositories/fines";
import { insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;
let librarian: number;
let fineId: number;

beforeAll(async () => {
  db = await adminConnection();
  librarian = await insertUser(db, "LIBRARIAN");
  const member = await insertUser(db, "STUDENT");
  const { copyIds } = await insertStockedBook(db, 1);
  const [loan] = await db.query<ResultSetHeader>(
    "INSERT INTO loans (copy_id, member_id, issued_by, issued_at, due_at) VALUES (?, ?, ?, NOW(3) - INTERVAL 20 DAY, NOW(3) - INTERVAL 3 DAY)",
    [copyIds[0], member, librarian],
  );
  const [fine] = await db.query<ResultSetHeader>(
    "INSERT INTO fines (loan_id, amount, days_overdue) VALUES (?, 15.00, 3)",
    [loan.insertId],
  );
  fineId = fine.insertId;
});

afterAll(async () => {
  await db.end();
  await closePools();
});

describe("settling a fine", () => {
  it("marks an unpaid fine paid and records who settled it", async () => {
    await settleFine(pool("librarian"), {
      fineId,
      action: "PAID",
      reason: null,
      actorId: librarian,
    });
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT status, settled_by FROM fines WHERE fine_id = ?",
      [fineId],
    );
    expect(rows[0]).toMatchObject({ status: "PAID", settled_by: librarian });
  });

  it("refuses a fine that is already settled", async () => {
    await expect(
      settleFine(pool("librarian"), { fineId, action: "PAID", reason: null, actorId: librarian }),
    ).rejects.toMatchObject({ code: "CONFLICT", message: "That fine is already settled." });
  });

  it("says a fine that does not exist is not found", async () => {
    await expect(
      settleFine(pool("librarian"), {
        fineId: 2_000_000_000,
        action: "PAID",
        reason: null,
        actorId: librarian,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", message: "No fine has that id." });
  });
});
