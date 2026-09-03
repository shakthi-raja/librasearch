import { existsSync } from "node:fs";
import { hash } from "@node-rs/argon2";
import type { Connection } from "mysql2/promise";
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

async function seedDemoUsers(db: Connection) {
  const passwordHash = await hash(DEMO_PASSWORD, {
    algorithm: 2,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });
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
        user.role === "STUDENT" ? 2024 : null,
        user.dept,
        user.role,
      ],
    );
  }
  out(`demo users   ${DEMO_USERS.length}`);
}

async function main() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  if (process.env.NODE_ENV === "production")
    throw new Error("refusing to seed demo data in production");
  const db = await adminConnection(adminEnv());
  try {
    await seedDepartments(db);
    await seedDemoUsers(db);
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`seed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
