import type { Connection, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { markNoticeRead, memberNotices, sendNotice } from "@/server/services/notices";
import { adminConnection } from "../support/db";
import { insertUser } from "../support/fixtures";

let db: Connection;

beforeAll(async () => {
  db = await adminConnection();
});

afterAll(async () => {
  await db.end();
});

const notice = {
  audience: "BOTH" as const,
  title: "Reading room hours",
  body: "The reading room closes at 8 pm this Friday.",
  link: "/account",
};

const unreadFor = async (userId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL",
    [userId],
  );
  return Number(rows[0]?.n ?? 0);
};

describe("sendNotice", () => {
  it("writes one unread notice for each active member in the audience", async () => {
    const student = await insertUser(db, "STUDENT");
    const faculty = await insertUser(db, "FACULTY");

    const recipients = await sendNotice(notice, faculty);
    expect(recipients).toBeGreaterThanOrEqual(2);
    expect(await unreadFor(student)).toBe(1);
    expect(await unreadFor(faculty)).toBe(1);
  });
});

describe("memberNotices", () => {
  it("lists the member's notices with an unread count", async () => {
    const student = await insertUser(db, "STUDENT");
    await sendNotice({ ...notice, audience: "STUDENT", title: "Only students" }, student);

    const { unread, notices } = await memberNotices(student, "STUDENT");
    expect(unread).toBe(1);
    expect(notices[0]).toMatchObject({ title: "Only students", link: "/account", readAt: null });
  });
});

describe("markNoticeRead", () => {
  it("marks only the caller's notice and only once", async () => {
    const student = await insertUser(db, "STUDENT");
    const other = await insertUser(db, "STUDENT");
    await sendNotice({ ...notice, audience: "STUDENT" }, student);

    const { notices } = await memberNotices(student, "STUDENT");
    const id = notices[0]?.id as number;

    expect(await markNoticeRead(id, student, "STUDENT")).toBe(true);
    expect(await markNoticeRead(id, student, "STUDENT")).toBe(false);
    expect(await unreadFor(student)).toBe(0);
    expect(await unreadFor(other)).toBe(1);
    expect(await markNoticeRead(id, other, "STUDENT")).toBe(false);
  });
});
