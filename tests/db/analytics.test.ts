import type { Connection, ResultSetHeader } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { libraryAnalytics } from "@/server/services/analytics";
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

const loan = async (input: {
  copyId: number;
  memberId: number;
  issuedDaysAgo: number;
  dueInDays: number;
  returnedDaysAgo?: number;
}) => {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO loans
       (copy_id, member_id, issued_by, issued_at, due_at, returned_at, end_reason, return_condition)
     VALUES (?, ?, ?, NOW(3) - INTERVAL ? DAY, NOW(3) + INTERVAL ? DAY, ?, ?, ?)`,
    [
      input.copyId,
      input.memberId,
      librarian,
      input.issuedDaysAgo,
      input.dueInDays,
      input.returnedDaysAgo === undefined
        ? null
        : new Date(Date.now() - input.returnedDaysAgo * 86_400_000),
      input.returnedDaysAgo === undefined ? null : "RETURNED",
      input.returnedDaysAgo === undefined ? null : "GOOD",
    ],
  );
  return result.insertId;
};

const setStatus = (copyId: number, status: string) =>
  db.query("UPDATE copies SET status = ? WHERE copy_id = ?", [status, copyId]);

describe("libraryAnalytics", () => {
  it("counts the period, the open loans and the overdue ones", async () => {
    const before = await libraryAnalytics();
    const stock = await insertStockedBook(db, 2);
    const student = await insertUser(db, "STUDENT");
    const other = await insertUser(db, "STUDENT");

    const recent = await loan({
      copyId: stock.copyIds[0] as number,
      memberId: student,
      issuedDaysAgo: 3,
      dueInDays: 7,
    });
    await setStatus(stock.copyIds[0] as number, "ON_LOAN");
    await loan({
      copyId: stock.copyIds[1] as number,
      memberId: other,
      issuedDaysAgo: 20,
      dueInDays: -2,
    });
    await setStatus(stock.copyIds[1] as number, "ON_LOAN");

    const after = await libraryAnalytics();
    expect(after.loans30 - before.loans30).toBe(2);
    expect(after.active - before.active).toBe(2);
    expect(after.overdue - before.overdue).toBe(1);

    // tidy up the second loan so the fine below is attached to a returned one
    await db.query(
      "UPDATE loans SET returned_at = NOW(3), end_reason = 'RETURNED' WHERE loan_id = ?",
      [recent],
    );
    await setStatus(stock.copyIds[0] as number, "AVAILABLE");
  });

  it("leaves loans older than thirty days out of the period figures", async () => {
    const before = await libraryAnalytics();
    const stock = await insertStockedBook(db, 1);
    const student = await insertUser(db, "STUDENT");
    const loanId = await loan({
      copyId: stock.copyIds[0] as number,
      memberId: student,
      issuedDaysAgo: 40,
      dueInDays: -30,
      returnedDaysAgo: 25,
    });
    expect(loanId).toBeGreaterThan(0);

    const after = await libraryAnalytics();
    expect(after.loans30).toBe(before.loans30);
    expect(after.topBooks.some((book) => book.bookId === stock.bookId)).toBe(false);
  });

  it("sums unpaid fines and counts waiting holds", async () => {
    const before = await libraryAnalytics();
    const stock = await insertStockedBook(db, 1);
    const student = await insertUser(db, "STUDENT");
    const loanId = await loan({
      copyId: stock.copyIds[0] as number,
      memberId: student,
      issuedDaysAgo: 10,
      dueInDays: -3,
      returnedDaysAgo: 1,
    });
    await db.query("INSERT INTO fines (loan_id, amount, days_overdue) VALUES (?, 42.50, 3)", [
      loanId,
    ]);
    await db.query("INSERT INTO holds (book_id, member_id) VALUES (?, ?)", [
      stock.bookId,
      await insertUser(db, "STUDENT"),
    ]);

    const after = await libraryAnalytics();
    expect(after.unpaid.amount - before.unpaid.amount).toBeCloseTo(42.5);
    expect(after.unpaid.count - before.unpaid.count).toBe(1);
    expect(after.holdsWaiting - before.holdsWaiting).toBe(1);
  });

  it("returns fourteen ascending days with today's traffic", async () => {
    const before = await libraryAnalytics();
    const stock = await insertStockedBook(db, 1);
    const student = await insertUser(db, "STUDENT");
    for (let i = 0; i < 3; i++) {
      const borrower = i === 0 ? student : await insertUser(db, "STUDENT");
      const lo = await loan({
        copyId: stock.copyIds[0] as number,
        memberId: borrower,
        issuedDaysAgo: 0,
        dueInDays: 5,
        returnedDaysAgo: 0,
      });
      expect(lo).toBeGreaterThan(0);
    }

    const stats = await libraryAnalytics();
    expect(stats.loans30 - before.loans30).toBe(3);
    expect(stats.daily).toHaveLength(14);
    expect((stats.daily[0]?.day ?? "") < (stats.daily.at(-1)?.day ?? "")).toBe(true);
    expect(stats.daily.at(-1)?.loans ?? 0).toBeGreaterThanOrEqual(3);
    expect(
      stats.topBooks.every(
        (book, index, all) => index === 0 || (all[index - 1]?.loans ?? 0) >= book.loans,
      ),
    ).toBe(true);
  });
});
