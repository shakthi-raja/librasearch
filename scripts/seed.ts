import { existsSync } from "node:fs";
import { hash } from "@node-rs/argon2";
import { Redis } from "ioredis";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { seedActivity } from "../db/seed/activity";
import { seedCatalogue } from "../db/seed/catalogue";
import { generate } from "../db/seed/generate";
import { OPEN_RESOURCES } from "../db/seed/open-resources";
import { SEARCH_ALIASES } from "../db/seed/search-aliases";
import { trendingKey } from "../src/lib/search/cache-keys";
import { adminConnection, adminEnv } from "./lib/admin-db";

const out = (line: string) => process.stdout.write(`${line}\n`);

// Demo accounts are documented in the README. They exist only in development
// and are the first thing to rotate anywhere else.
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Libra@2026";

const DEPARTMENTS = [
  ["CSE", "Computer Science and Engineering"],
  ["ECE", "Electronics and Communication Engineering"],
  ["EEE", "Electrical and Electronics Engineering"],
  ["ME", "Mechanical Engineering"],
  ["MATH", "Mathematics"],
  ["MGMT", "Management Studies"],
] as const;

const DEMO_USERS = [
  {
    role: "LIBRARIAN",
    universityId: "LIB0001",
    fullName: "Meera Krishnan",
    email: "librarian@librasearch.local",
    dept: null,
    designation: "Senior Librarian",
  },
  {
    role: "FACULTY",
    universityId: "FAC0001",
    fullName: "Arvind Rao",
    email: "faculty@librasearch.local",
    dept: "CSE",
    designation: "Associate Professor",
  },
  {
    role: "STUDENT",
    universityId: "PES1UG24CS001",
    fullName: "Ananya Iyer",
    email: "student@librasearch.local",
    dept: "CSE",
    designation: null,
    batch: 2024,
  },
  // the two of us, so we can sign in as ourselves and link Google; both of us
  // take the fifth semester courses this term, whatever our admission year
  {
    role: "STUDENT",
    universityId: "PES1UG25CS843",
    fullName: "Shakthi Raja G P",
    email: "shakthi.raja@librasearch.local",
    dept: "CSE",
    designation: null,
    batch: 2024,
  },
  {
    role: "STUDENT",
    universityId: "PES2UG23CS277",
    fullName: "Kishan S",
    email: "kishan.s@librasearch.local",
    dept: "CSE",
    designation: null,
    batch: 2024,
  },
] as const;

async function seedDepartments(db: Connection) {
  await db.query(
    `INSERT INTO departments (dept_code, dept_name) VALUES ?
     ON DUPLICATE KEY UPDATE dept_name = VALUES(dept_name)`,
    [DEPARTMENTS.map(([code, name]) => [code, name])],
  );
  out(`departments  ${DEPARTMENTS.length}`);
}

function demoPasswordHash() {
  return hash(DEMO_PASSWORD, {
    algorithm: 2,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });
}

async function seedDemoUsers(db: Connection, passwordHash: string) {
  for (const user of DEMO_USERS) {
    await db.query(
      `INSERT INTO users
         (role_id, dept_id, university_id, full_name, email, password_hash, designation, program, batch_year)
       SELECT r.role_id, d.dept_id, ?, ?, ?, ?, ?, ?, ?
         FROM roles r
         LEFT JOIN departments d ON d.dept_code = ?
        WHERE r.role_name = ?
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
      [
        user.universityId,
        user.fullName,
        user.email,
        passwordHash,
        user.designation,
        user.role === "STUDENT" ? "B.Tech CSE" : null,
        "batch" in user ? user.batch : null,
        user.dept,
        user.role,
      ],
    );
  }
  out(`demo users   ${DEMO_USERS.length}`);
}

// The home page reads trending searches from redis; give it the last week of the log.
async function primeTrending(db: Connection) {
  if (!process.env.REDIS_URL) return 0;
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT LOWER(TRIM(query_text)) AS query, DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS n
       FROM search_log
      WHERE result_count > 0 AND created_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY
      GROUP BY query, day`,
  );
  const client = new Redis(process.env.REDIS_URL, {
    keyPrefix: `${process.env.DB_NAME ?? "librasearch"}:`,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  try {
    await client.connect();
    const batch = client.multi();
    for (const row of rows) {
      const key = trendingKey(new Date(`${row.day}T12:00:00Z`));
      batch.zadd(key, "GT", Number(row.n), String(row.query)).expire(key, 8 * 24 * 3600);
    }
    batch.del("search:trending:top");
    await batch.exec();
    return rows.length;
  } catch {
    // trending fills up on its own as people search
    return 0;
  } finally {
    client.disconnect();
  }
}

async function main() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  if (process.env.NODE_ENV === "production")
    throw new Error("refusing to seed demo data in production");
  const db = await adminConnection(adminEnv());
  try {
    await seedDepartments(db);
    const passwordHash = await demoPasswordHash();
    await seedDemoUsers(db, passwordHash);
    const catalogue = await seedCatalogue(db);
    out(
      `catalogue    ${catalogue.books} books, ${catalogue.editions} editions, ${catalogue.chapters} chapters`,
    );
    const people = await generate(db, passwordHash);
    out(
      `people       ${people.students} students, ${people.faculty} faculty, ${people.librarians} librarians`,
    );
    out(
      `academics    ${people.courses} courses, ${people.units} units, ${people.enrollments} enrollments`,
    );
    out(`stock        ${people.copies} copies`);

    for (const [alias, expansion] of SEARCH_ALIASES) {
      await db.query(
        `INSERT INTO search_aliases (alias, expansion, source) VALUES (?, ?, 'SEEDED')
         ON DUPLICATE KEY UPDATE expansion = IF(source = 'SEEDED', VALUES(expansion), expansion)`,
        [alias, expansion],
      );
    }
    out(`aliases      ${SEARCH_ALIASES.length}`);

    for (const resource of OPEN_RESOURCES) {
      await db.query(
        `INSERT INTO open_resources (book_id, url, kind, provider, licence)
         SELECT book_id, ?, ?, ?, ? FROM editions WHERE isbn13 = ?
         ON DUPLICATE KEY UPDATE kind = VALUES(kind), provider = VALUES(provider), licence = VALUES(licence)`,
        [resource.url, resource.kind, resource.provider, resource.licence ?? null, resource.isbn13],
      );
    }
    out(`open shelf   ${OPEN_RESOURCES.length}`);

    const activity = await seedActivity(db);
    out(
      activity
        ? `activity     ${activity.loans} loans (${activity.open} out, ${activity.overdue} overdue), ${activity.holds} holds, ${activity.fines} fines, ${activity.requests} requests, ${activity.searches} searches`
        : "activity     kept, the library already has loans",
    );
    out(`trending     ${await primeTrending(db)} entries`);
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`seed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
