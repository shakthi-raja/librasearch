import { faker } from "@faker-js/faker";
import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

// A term of library use up to the moment of seeding: loans and returns, late
// fines, hold queues on the textbooks everyone needs, purchase requests and
// searches. Everything goes through the same triggers as the desk, so the
// history obeys the loan limits, the reference rule and one open loan per copy.

const DAY = 86_400_000;
const HOUR = 3_600_000;
const HISTORY_DAYS = 84;

// the browser suite issues, returns and scans these, so they stay free
const RESERVED_BARCODES = new Set(["LS26000005", "LS26000007"]);
const RESERVED_MEMBERS = new Set(["PES1UG24CS003"]);
// demo accounts get a believable record of their own and never an overdue loan
const DEMO_MEMBERS = ["PES1UG24CS001", "PES1UG25CS843", "PES2UG23CS277", "FAC0001"];
const HOLD_READY_FOR = "PES1UG24CS001";

const SHORTAGE_BOOKS = 5;

type Member = { id: number; code: string; role: string; max: number };
type Copy = { id: number; barcode: string; policy: string; bookId: number };
type Loan = {
  copy: Copy;
  member: Member;
  issuedAt: number;
  dueAt: number;
  returnedAt: number | null;
  rule: "STANDARD" | "HIGH_DEMAND" | "SHORT_LOAN";
  renewals: number;
};

export type ActivityCounts = {
  loans: number;
  open: number;
  overdue: number;
  holds: number;
  fines: number;
  requests: number;
  searches: number;
};

const SEARCHES: [query: string, found: boolean, weight: number][] = [
  ["dbms", true, 14],
  ["normalization", true, 12],
  ["cn", true, 10],
  ["deadlock", true, 9],
  ["machine learning", true, 9],
  ["UE24CS351A", true, 7],
  ["sql joins", true, 7],
  ["transaction isolation", true, 6],
  ["b+ tree indexing", true, 6],
  ["software engineering", true, 6],
  ["tcp congestion control", true, 5],
  ["daa", true, 5],
  ["dynamic programming", true, 5],
  ["os", true, 5],
  ["paging and virtual memory", true, 5],
  ["big data hadoop", true, 4],
  ["graph theory", true, 4],
  ["linear regression", true, 4],
  ["neural networks", true, 4],
  ["er diagram", true, 4],
  ["two phase locking", true, 3],
  ["image processing", true, 3],
  ["agile scrum", true, 3],
  ["routing algorithms", true, 3],
  ["compiler design", true, 3],
  ["rag", true, 2],
  ["ui/ux", true, 2],
  ["discrete mathematics", true, 2],
  ["how computers talk over a network", true, 2],
  ["quantum blockchain notes", false, 2],
  ["previous year question papers", false, 3],
  ["gate cse 2027 mock", false, 2],
  ["kannada novels", false, 1],
  ["placement aptitude", false, 2],
];

const WAIVERS = [
  "Medical leave certificate shown at the desk",
  "Returned during the library closure",
  "First late return, waived once",
];

const VENDORS = ["Sapna Book House", "Higginbothams", "Prism Books"];

/** Moves a moment into desk hours, 09:30 to 17:30 IST on a working day. */
function atDesk(ms: number) {
  const d = new Date(ms);
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  const hour = d.getUTCHours();
  if (hour < 4 || hour >= 12) d.setUTCHours(faker.number.int({ min: 4, max: 11 }));
  d.setUTCMinutes(faker.number.int({ min: 0, max: 59 }), faker.number.int({ min: 0, max: 59 }));
  return d.getTime();
}

const sql = (ms: number) => new Date(ms);

export async function seedActivity(
  db: Connection,
  now = Date.now(),
): Promise<ActivityCounts | null> {
  const [[existing]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM loans");
  if (Number(existing?.n) > 0) return null;
  faker.seed(20261010);

  const [memberRows] = await db.query<RowDataPacket[]>(
    `SELECT u.user_id, u.university_id, r.role_name, r.max_loans
       FROM users u JOIN roles r ON r.role_id = u.role_id
      WHERE u.status = 'ACTIVE' AND r.role_name IN ('STUDENT', 'FACULTY')
      ORDER BY u.user_id`,
  );
  const members = memberRows.map(
    (row): Member => ({
      id: Number(row.user_id),
      code: String(row.university_id),
      role: String(row.role_name),
      max: Number(row.max_loans),
    }),
  );
  const byCode = new Map(members.map((m) => [m.code, m]));
  const byId = new Map(members.map((m) => [m.id, m]));
  const students = members.filter((m) => m.role === "STUDENT" && !RESERVED_MEMBERS.has(m.code));
  const demo = new Set(DEMO_MEMBERS.map((code) => byCode.get(code)?.id).filter(Boolean));

  const [librarianRows] = await db.query<RowDataPacket[]>(
    `SELECT u.user_id FROM users u JOIN roles r ON r.role_id = u.role_id
      WHERE r.role_name = 'LIBRARIAN' ORDER BY u.user_id`,
  );
  const librarians = librarianRows.map((row) => Number(row.user_id));
  const desk = () => faker.helpers.arrayElement(librarians);

  const [copyRows] = await db.query<RowDataPacket[]>(
    `SELECT c.copy_id, c.barcode, c.loan_policy, e.book_id
       FROM copies c
       JOIN editions e ON e.edition_id = c.edition_id
       JOIN books b ON b.book_id = e.book_id
      WHERE c.status = 'AVAILABLE' AND b.status = 'ACTIVE'
      ORDER BY c.copy_id`,
  );
  const copies = copyRows.map(
    (row): Copy => ({
      id: Number(row.copy_id),
      barcode: String(row.barcode),
      policy: String(row.loan_policy),
      bookId: Number(row.book_id),
    }),
  );
  const lendable = copies.filter((c) => c.policy !== "REFERENCE_ONLY");
  const reservedBooks = new Set(
    copies.filter((c) => RESERVED_BARCODES.has(c.barcode)).map((c) => c.bookId),
  );

  // who needs each book: students in a course that prescribes it, and its coordinators
  const [readerRows] = await db.query<RowDataPacket[]>(
    `SELECT DISTINCT cb.book_id, en.student_id AS member_id
       FROM course_books cb
       JOIN course_offerings o ON o.course_id = cb.course_id
       JOIN enrollments en ON en.offering_id = o.offering_id
     UNION
     SELECT DISTINCT cb.book_id, o.coordinator_id
       FROM course_books cb
       JOIN course_offerings o ON o.course_id = cb.course_id
      WHERE o.coordinator_id IS NOT NULL`,
  );
  const readers = new Map<number, Member[]>();
  for (const row of readerRows) {
    const member = byId.get(Number(row.member_id));
    if (!member || RESERVED_MEMBERS.has(member.code)) continue;
    const list = readers.get(Number(row.book_id)) ?? [];
    list.push(member);
    readers.set(Number(row.book_id), list);
  }
  const popularity = (bookId: number) => readers.get(bookId)?.length ?? 0;
  const busiest = Math.max(1, ...lendable.map((c) => popularity(c.bookId)));

  const openCount = new Map<number, number>();
  const openBooks = new Set<string>();
  const historyCount = new Map<number, number>();
  const canHoldOpen = (m: Member, bookId: number) =>
    (openCount.get(m.id) ?? 0) < m.max && !openBooks.has(`${m.id}:${bookId}`);

  function pickMember(bookId: number, open: boolean, overdue: boolean): Member | null {
    const fits = (m: Member) => (!open || canHoldOpen(m, bookId)) && !(overdue && demo.has(m.id));
    const wanted = (readers.get(bookId) ?? []).filter(fits);
    const demoWanted = wanted.filter((m) => demo.has(m.id) && (historyCount.get(m.id) ?? 0) < 9);
    if (demoWanted.length > 0 && faker.number.float() < 0.2) {
      return faker.helpers.arrayElement(demoWanted);
    }
    if (wanted.length > 0 && faker.number.float() < 0.85) return faker.helpers.arrayElement(wanted);
    for (let tries = 0; tries < 20; tries++) {
      const any = faker.helpers.arrayElement(
        faker.number.float() < 0.1 ? members.filter((m) => m.role === "FACULTY") : students,
      );
      if (fits(any) && !RESERVED_MEMBERS.has(any.code)) return any;
    }
    return null;
  }

  const take = (loan: Loan) => {
    historyCount.set(loan.member.id, (historyCount.get(loan.member.id) ?? 0) + 1);
    if (loan.returnedAt === null) {
      openCount.set(loan.member.id, (openCount.get(loan.member.id) ?? 0) + 1);
      openBooks.add(`${loan.member.id}:${loan.copy.bookId}`);
    }
  };

  // each copy goes out and comes back in turn; textbooks hardly rest on the shelf
  const loans: Loan[] = [];
  const lastOf = new Map<number, Loan>();
  for (const copy of lendable) {
    const busy = popularity(copy.bookId) / busiest;
    const gap = () =>
      busy > 0.3
        ? faker.number.float({ min: 0.5, max: 4 }) * DAY
        : busy > 0
          ? faker.number.float({ min: 3, max: 20 }) * DAY
          : faker.number.float({ min: 12, max: 45 }) * DAY;
    let t = now - HISTORY_DAYS * DAY + faker.number.float({ min: 0, max: 1 }) * gap();
    while (t < now - 2 * HOUR) {
      const issuedAt = atDesk(t);
      if (issuedAt >= now - HOUR) break;
      const short = copy.policy === "SHORT_LOAN";
      const renewals = !short && faker.number.float() < 0.12 ? 1 : 0;
      const dueAt = issuedAt + (short ? 3 : 14) * (renewals + 1) * DAY;
      const late = faker.number.float() < 0.13;
      const keptFor = late
        ? dueAt - issuedAt + faker.number.float({ min: 0.5, max: 12 }) * DAY
        : (dueAt - issuedAt) * faker.number.float({ min: 0.15, max: 0.95 });
      const returnedAt = atDesk(issuedAt + keptFor);
      const open = returnedAt >= now - HOUR;
      if (open && RESERVED_BARCODES.has(copy.barcode)) break;
      // most copies are back on the shelf by now; busy textbooks less often
      if (open && faker.number.float() > 0.2 + 0.5 * busy) break;
      const member = pickMember(copy.bookId, open, open && dueAt < now);
      if (!member) break;
      const loan: Loan = {
        copy,
        member,
        issuedAt,
        dueAt,
        returnedAt: open ? null : Math.max(returnedAt, issuedAt + HOUR),
        rule: short ? "SHORT_LOAN" : "STANDARD",
        renewals,
      };
      loans.push(loan);
      take(loan);
      lastOf.set(copy.id, loan);
      if (open) break;
      t = (loan.returnedAt ?? now) + gap();
    }
  }

  // the most wanted textbooks are all out at once, which is what the demand screen is for
  const shortage = [...new Set(lendable.map((c) => c.bookId))]
    .filter((bookId) => !reservedBooks.has(bookId))
    .filter((bookId) => lendable.filter((c) => c.bookId === bookId).length >= 2)
    .sort((a, b) => popularity(b) - popularity(a) || a - b)
    .slice(0, SHORTAGE_BOOKS);
  for (const bookId of shortage) {
    for (const copy of lendable.filter((c) => c.bookId === bookId)) {
      const last = lastOf.get(copy.id);
      if (last && last.returnedAt === null) continue;
      const after =
        (last?.returnedAt ?? now - 10 * DAY) + faker.number.float({ min: 2, max: 30 }) * HOUR;
      const issuedAt = atDesk(Math.max(after, now - faker.number.float({ min: 1, max: 6 }) * DAY));
      if (issuedAt >= now - HOUR || (last?.returnedAt && issuedAt <= last.returnedAt)) continue;
      const member = pickMember(bookId, true, false);
      if (!member) continue;
      const loan: Loan = {
        copy,
        member,
        issuedAt,
        dueAt: issuedAt + 7 * DAY,
        returnedAt: null,
        rule: "HIGH_DEMAND",
        renewals: 0,
      };
      loans.push(loan);
      take(loan);
      lastOf.set(copy.id, loan);
    }
  }

  // demo accounts open the app to something on their own shelf; the first
  // student's oldest loan falls due in a day or two
  for (const code of DEMO_MEMBERS) {
    const member = byCode.get(code);
    if (!member) continue;
    const want = code === HOLD_READY_FOR || code === "FAC0001" ? 2 : 1;
    const candidates = faker.helpers.shuffle(
      lendable.filter(
        (c) =>
          !RESERVED_BARCODES.has(c.barcode) &&
          !shortage.includes(c.bookId) &&
          (readers.get(c.bookId) ?? []).some((m) => m.id === member.id),
      ),
    );
    let first = true;
    for (const copy of candidates) {
      if ((openCount.get(member.id) ?? 0) >= want) break;
      const last = lastOf.get(copy.id);
      if (!canHoldOpen(member, copy.bookId) || (last && last.returnedAt === null)) continue;
      const daysAgo =
        first && code === HOLD_READY_FOR ? 12.6 : faker.number.float({ min: 1, max: 9 });
      const issuedAt = atDesk(now - daysAgo * DAY);
      if (issuedAt >= now - HOUR || (last?.returnedAt && issuedAt <= last.returnedAt + HOUR)) {
        continue;
      }
      const loan: Loan = {
        copy,
        member,
        issuedAt,
        dueAt: issuedAt + 14 * DAY,
        returnedAt: null,
        rule: "STANDARD",
        renewals: 0,
      };
      loans.push(loan);
      take(loan);
      lastOf.set(copy.id, loan);
      first = false;
    }
  }

  // one copy came back this morning and waits on the hold shelf for a demo student
  const holder = byCode.get(HOLD_READY_FOR);
  let ready: { loan: Loan; bookId: number } | null = null;
  if (holder) {
    for (const bookId of shortage) {
      if (openBooks.has(`${holder.id}:${bookId}`)) continue;
      const loan = loans.find(
        (l) =>
          l.copy.bookId === bookId &&
          l.returnedAt === null &&
          l.member.id !== holder.id &&
          l.issuedAt < now - 12 * HOUR,
      );
      if (!loan) continue;
      loan.returnedAt = now - faker.number.float({ min: 3, max: 8 }) * HOUR;
      openCount.set(loan.member.id, (openCount.get(loan.member.id) ?? 1) - 1);
      openBooks.delete(`${loan.member.id}:${bookId}`);
      ready = { loan, bookId };
      break;
    }
  }

  // closed loans first, so no member is ever over the limit when a row goes in
  const ordered = [
    ...loans.filter((l) => l.returnedAt !== null).sort((a, b) => a.issuedAt - b.issuedAt),
    ...loans.filter((l) => l.returnedAt === null).sort((a, b) => a.issuedAt - b.issuedAt),
  ];
  const loanIds = new Map<Loan, number>();
  for (const loan of ordered) {
    const closed = loan.returnedAt !== null;
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO loans
         (copy_id, member_id, issued_by, issued_at, due_at, period_rule, renew_count,
          returned_at, received_by, end_reason, return_condition)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        loan.copy.id,
        loan.member.id,
        desk(),
        sql(loan.issuedAt),
        sql(loan.dueAt),
        loan.rule,
        loan.renewals,
        closed ? sql(loan.returnedAt as number) : null,
        closed ? desk() : null,
        closed ? "RETURNED" : null,
        closed ? (faker.number.float() < 0.9 ? "GOOD" : "WORN") : null,
      ],
    );
    loanIds.set(loan, result.insertId);
  }
  const open = ordered.filter((l) => l.returnedAt === null);
  if (open.length > 0) {
    await db.query("UPDATE copies SET status = 'ON_LOAN' WHERE copy_id IN (?)", [
      open.map((l) => l.copy.id),
    ]);
  }

  // late returns: most paid at the desk, a few waived, a few still owed
  const owed = new Map<number, number>();
  let fines = 0;
  for (const loan of ordered) {
    if (loan.returnedAt === null || loan.returnedAt <= loan.dueAt) continue;
    const days = Math.ceil((loan.returnedAt - loan.dueAt) / DAY);
    const amount = Math.min(days * 5, 200);
    const roll = faker.number.float();
    const canOwe =
      !demo.has(loan.member.id) && (owed.get(loan.member.id) ?? 0) + amount <= 60 && roll > 0.82;
    const status = canOwe ? "UNPAID" : roll < 0.12 ? "WAIVED" : "PAID";
    if (status === "UNPAID") owed.set(loan.member.id, (owed.get(loan.member.id) ?? 0) + amount);
    const settledAt =
      status === "UNPAID"
        ? null
        : Math.min(loan.returnedAt + faker.number.float({ min: 0, max: 72 }) * HOUR, now - HOUR);
    await db.query(
      `INSERT INTO fines
         (loan_id, amount, days_overdue, status, created_at, settled_at, settled_by, waiver_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        loanIds.get(loan),
        amount,
        days,
        status,
        sql(loan.returnedAt),
        settledAt === null ? null : sql(settledAt),
        settledAt === null ? null : desk(),
        status === "WAIVED" ? faker.helpers.arrayElement(WAIVERS) : null,
      ],
    );
    fines++;
  }

  // queues behind the textbooks that are all out
  let holds = 0;
  const holdBooks = new Map<number, { title: string }>();
  const [titleRows] = await db.query<RowDataPacket[]>(
    "SELECT book_id, title FROM books WHERE book_id IN (?)",
    [shortage.length > 0 ? shortage : [0]],
  );
  for (const row of titleRows) holdBooks.set(Number(row.book_id), { title: String(row.title) });

  if (ready && holder) {
    const readyAt = (ready.loan.returnedAt as number) + 2 * 60_000;
    await db.query(
      `INSERT INTO holds (book_id, member_id, placed_at, status, ready_copy_id, ready_at, pickup_by)
       VALUES (?, ?, ?, 'READY', ?, ?, ?)`,
      [
        ready.bookId,
        holder.id,
        sql(now - 6 * DAY),
        ready.loan.copy.id,
        sql(readyAt),
        sql(readyAt + 48 * HOUR),
      ],
    );
    await db.query("UPDATE copies SET status = 'ON_HOLD_SHELF' WHERE copy_id = ?", [
      ready.loan.copy.id,
    ]);
    const pickup = new Date(readyAt + 48 * HOUR).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
    await db.query(
      `INSERT INTO notifications (user_id, type, title, body, link, created_at)
       VALUES (?, 'HOLD_READY', 'Your hold is ready', ?, '/student', ?)`,
      [
        holder.id,
        `${holdBooks.get(ready.bookId)?.title ?? "Your book"} is waiting for you on the hold shelf until ${pickup}.`,
        sql(readyAt),
      ],
    );
    holds++;
  }

  for (const bookId of shortage) {
    const queue = faker.helpers
      .shuffle(
        (readers.get(bookId) ?? []).filter(
          (m) => !openBooks.has(`${m.id}:${bookId}`) && m.id !== holder?.id,
        ),
      )
      .slice(0, faker.number.int({ min: 2, max: 4 }));
    const times = queue
      .map(() => now - faker.number.float({ min: 0.3, max: 5.5 }) * DAY)
      .sort((a, b) => a - b);
    for (const [i, member] of queue.entries()) {
      await db.query("INSERT INTO holds (book_id, member_id, placed_at) VALUES (?, ?, ?)", [
        bookId,
        member.id,
        sql(times[i] as number),
      ]);
      holds++;
    }
  }

  // and the holds of earlier weeks, collected, missed or withdrawn
  const pastBooks = shortage.concat(
    [...readers.keys()].filter((b) => !reservedBooks.has(b)).slice(0, 10),
  );
  for (let i = 0; i < 36; i++) {
    const bookId = faker.helpers.arrayElement(pastBooks);
    const member = faker.helpers.arrayElement(readers.get(bookId) ?? students);
    const placedAt = now - faker.number.float({ min: 12, max: HISTORY_DAYS - 4 }) * DAY;
    const outcome = faker.helpers.weightedArrayElement([
      { weight: 7, value: ["FULFILLED", "Collected at the desk"] },
      { weight: 2, value: ["EXPIRED", "Not collected within 48 hours"] },
      { weight: 2, value: ["CANCELLED", "Cancelled by the member"] },
    ]);
    await db.query(
      `INSERT INTO holds (book_id, member_id, placed_at, status, closed_at, close_reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        bookId,
        member.id,
        sql(placedAt),
        outcome[0],
        sql(placedAt + faker.number.float({ min: 1, max: 6 }) * DAY),
        outcome[1],
      ],
    );
    holds++;
  }

  // overdue loans start owing today, and due or late loans get their notices
  await db.query("CALL sp_accrue_fines()");
  await db.query("CALL sp_send_due_notices()");
  const [[fineCount]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM fines");

  // coordinators asking for more copies of what is short, at every stage of the order
  const [unitRows] = await db.query<RowDataPacket[]>(
    `SELECT cb.book_id, o.coordinator_id, MIN(su.unit_id) AS unit_id,
            MIN(ed.isbn13) AS isbn13, b.title,
            (SELECT a.full_name FROM book_authors ba JOIN authors a ON a.author_id = ba.author_id
              WHERE ba.book_id = b.book_id ORDER BY ba.author_order LIMIT 1) AS author
       FROM course_books cb
       JOIN course_offerings o ON o.course_id = cb.course_id AND o.coordinator_id IS NOT NULL
       JOIN syllabus_units su ON su.offering_id = o.offering_id
       JOIN books b ON b.book_id = cb.book_id
       JOIN editions ed ON ed.book_id = b.book_id
      WHERE cb.book_id IN (?)
      GROUP BY cb.book_id, o.coordinator_id, b.title, b.book_id`,
    [shortage.length > 0 ? shortage : [0]],
  );
  const stages = ["PENDING", "ORDERED", "APPROVED", "PENDING", "REJECTED", "RECEIVED"];
  const seen = new Set<number>();
  let requests = 0;
  for (const row of unitRows) {
    if (seen.has(Number(row.book_id))) continue;
    seen.add(Number(row.book_id));
    const status = stages[requests % stages.length] as string;
    const createdAt = now - faker.number.float({ min: 2, max: 20 }) * DAY;
    const reviewedAt =
      status === "PENDING" ? null : createdAt + faker.number.float({ min: 0.5, max: 2 }) * DAY;
    const waiting = popularity(Number(row.book_id));
    await db.query(
      `INSERT INTO purchase_requests
         (requested_by, unit_id, title, author, isbn13, reason, quantity, status,
          reviewed_by, reviewed_at, review_note, vendor, expected_on, received_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(row.coordinator_id),
        Number(row.unit_id),
        String(row.title),
        row.author ? String(row.author) : null,
        row.isbn13 ? String(row.isbn13) : null,
        `Prescribed for ${waiting} students this term and every copy is out before the exams.`,
        faker.number.int({ min: 2, max: 5 }),
        status,
        reviewedAt === null ? null : desk(),
        reviewedAt === null ? null : sql(reviewedAt),
        status === "REJECTED"
          ? "Two copies arrive with the order already placed for this course."
          : reviewedAt === null
            ? null
            : "Approved from the textbook budget.",
        status === "ORDERED" || status === "RECEIVED" ? faker.helpers.arrayElement(VENDORS) : null,
        status === "ORDERED" ? sql(now + 10 * DAY) : null,
        status === "RECEIVED"
          ? sql(Math.min((reviewedAt ?? createdAt) + 6 * DAY, now - DAY))
          : null,
        sql(createdAt),
      ],
    );
    requests++;
  }

  // what people searched for, busier in the last fortnight
  const pool = SEARCHES.flatMap(([query, found, weight]) =>
    Array.from({ length: weight }, () => [query, found] as const),
  );
  const popularBooks = shortage.concat([...readers.keys()].slice(0, 12));
  let searches = 0;
  for (let i = 0; i < 420; i++) {
    const [query, found] = faker.helpers.arrayElement(pool);
    const ago =
      faker.number.float() < 0.6
        ? faker.number.float({ min: 0, max: 14 })
        : faker.number.float({ min: 14, max: 30 });
    const createdAt = Math.min(atDesk(now - ago * DAY), now - 60_000);
    const clicked =
      found && faker.number.float() < 0.4 ? faker.helpers.arrayElement(popularBooks) : null;
    await db.query(
      `INSERT INTO search_log
         (user_id, query_text, mode, result_count, top_score, latency_ms, clicked_book_id, clicked_at, created_at)
       VALUES (?, ?, 'HYBRID', ?, ?, ?, ?, ?, ?)`,
      [
        faker.number.float() < 0.7 ? faker.helpers.arrayElement(students).id : null,
        query,
        found ? faker.number.int({ min: 4, max: 20 }) : 0,
        found ? faker.number.float({ min: 0.45, max: 0.92, fractionDigits: 4 }) : null,
        faker.number.int({ min: 35, max: 420 }),
        clicked,
        clicked === null ? null : sql(createdAt + faker.number.int({ min: 3, max: 40 }) * 1000),
        sql(createdAt),
      ],
    );
    searches++;
  }

  return {
    loans: ordered.length,
    open: open.length,
    overdue: open.filter((l) => l.dueAt < now).length,
    holds,
    fines: Number(fineCount?.n ?? fines),
    requests,
    searches,
  };
}
