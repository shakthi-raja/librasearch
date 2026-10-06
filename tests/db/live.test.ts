import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type LiveEvent, listenLive, publishLive } from "@/server/live";
import { issueCopy, returnCopy } from "@/server/services/circulation";
import { placeHold } from "@/server/services/holds";
import { insertStockedBook } from "../support/catalogue";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

const nextEvent = (userId: number, role: "STUDENT" | "FACULTY") =>
  new Promise<LiveEvent>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("no live event within 3 seconds")), 3000);
    const stop = listenLive(userId, role, (event) => {
      clearTimeout(timer);
      stop();
      resolve(event);
    });
  });

const universityId = async (userId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT university_id FROM users WHERE user_id = ?",
    [userId],
  );
  return String(rows[0]?.university_id);
};

describe("live events", () => {
  it("reach the member they are for", async () => {
    const member = await insertUser(db, "STUDENT");
    const waiting = nextEvent(member, "STUDENT");
    // the subscriber needs a moment on a fresh process
    await new Promise((resolve) => setTimeout(resolve, 300));
    await publishLive(
      { userId: member },
      { type: "notice", title: "Hello", body: "Just you", link: null },
    );
    expect(await waiting).toMatchObject({ type: "notice", title: "Hello" });
  });

  it("tell the next member in the queue when a return fills their hold", async () => {
    const { bookId, copyIds } = await insertStockedBook(db, 1);
    const [rows] = await db.query<RowDataPacket[]>("SELECT barcode FROM copies WHERE copy_id = ?", [
      copyIds[0],
    ]);
    const barcode = String(rows[0]?.barcode);
    const librarian = await insertUser(db, "LIBRARIAN");
    const borrower = await insertUser(db, "STUDENT");
    const waiter = await insertUser(db, "STUDENT");

    await issueCopy({
      memberIdentifier: await universityId(borrower),
      barcode,
      actorId: librarian,
    });
    await placeHold({ bookId, memberId: waiter, role: "STUDENT" });

    const waiting = nextEvent(waiter, "STUDENT");
    await new Promise((resolve) => setTimeout(resolve, 300));
    await returnCopy({ barcode, actorId: librarian });

    expect(await waiting).toMatchObject({ type: "hold-ready", title: "Your hold is ready" });
    const [notices] = await db.query<RowDataPacket[]>(
      "SELECT type, link FROM notifications WHERE user_id = ? ORDER BY notification_id",
      [waiter],
    );
    expect(notices).toEqual([{ type: "HOLD_READY", link: "/student" }]);
  });
});
