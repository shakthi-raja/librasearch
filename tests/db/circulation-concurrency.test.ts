import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { insertStockedBook } from "../support/catalogue";
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

const copyRow = async (copyId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT barcode, status FROM copies WHERE copy_id = ?",
    [copyId],
  );
  return rows[0] as { barcode: string; status: string };
};

describe("the last copy at two desks", () => {
  it("lets exactly one issue win, five times over", async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { copyIds } = await insertStockedBook(db, 1);
      const copyId = copyIds[0] as number;
      const copy = await copyRow(copyId);
      const first = await insertUser(db, "STUDENT");
      const second = await insertUser(db, "STUDENT");

      const deskA = await adminConnection();
      const deskB = await adminConnection();
      const call = (desk: Connection, member: number) =>
        desk.query("CALL sp_issue_copy(?, ?, ?, @loan)", [copy.barcode, member, librarian]);

      const results = await Promise.allSettled([call(deskA, first), call(deskB, second)]);
      await deskA.end();
      await deskB.end();

      const won = results.filter((result) => result.status === "fulfilled");
      const lost = results.filter((result) => result.status === "rejected");
      expect(won).toHaveLength(1);
      expect(lost).toHaveLength(1);

      const reason = (lost[0] as PromiseRejectedResult).reason as {
        errno?: number;
        sqlMessage?: string;
      };
      expect(reason.errno).toBe(1644);
      expect(reason.sqlMessage).toMatch(/LS003/);

      const [loans] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS n FROM loans WHERE copy_id = ?",
        [copyId],
      );
      expect(Number(loans[0]?.n)).toBe(1);
      expect((await copyRow(copyId)).status).toBe("ON_LOAN");
    }
  }, 60_000);
});
