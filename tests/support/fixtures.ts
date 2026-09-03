import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

/** A syntactically valid argon2id hash, used only where the hash itself is not under test. */
export const FAKE_ARGON2ID =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$7Wc0nNhPFBRY5ZQx1nqD3oFQ0r3hFjYc3n0nZqB0p1s";

let sequence = 0;

export async function roleId(db: Connection, name: "STUDENT" | "FACULTY" | "LIBRARIAN") {
  const [rows] = await db.query<RowDataPacket[]>("SELECT role_id FROM roles WHERE role_name = ?", [
    name,
  ]);
  const id = rows[0]?.role_id;
  if (typeof id !== "number") throw new Error(`role ${name} is not seeded`);
  return id;
}

const letters = (n: number) => {
  let out = "";
  for (let v = n; v > 0; v = Math.floor((v - 1) / 26)) {
    out = String.fromCharCode(65 + ((v - 1) % 26)) + out;
  }
  return out;
};

export async function insertDepartment(db: Connection, code = `T${letters(++sequence)}`) {
  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO departments (dept_code, dept_name) VALUES (?, ?)",
    [code, `Department ${code}`],
  );
  return result.insertId;
}

export async function insertUser(
  db: Connection,
  role: "STUDENT" | "FACULTY" | "LIBRARIAN",
  overrides: Partial<{ email: string; universityId: string; deptId: number | null }> = {},
) {
  const n = ++sequence;
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO users (role_id, dept_id, university_id, full_name, email, password_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      await roleId(db, role),
      overrides.deptId ?? null,
      overrides.universityId ?? `TST${role.slice(0, 3)}${n.toString().padStart(5, "0")}`,
      `Test ${role.toLowerCase()} ${n}`,
      overrides.email ?? `${role.toLowerCase()}.${n}@test.librasearch.local`,
      FAKE_ARGON2ID,
    ],
  );
  return result.insertId;
}
