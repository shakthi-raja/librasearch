import mysql from "mysql2/promise";
import { appEnvSchema, parseEnv } from "@/lib/config/schema";

type Account = "auth" | "student" | "faculty" | "librarian";

/** Connects to the test schema as one of the application accounts. */
export function accountConnection(account: Account) {
  const env = parseEnv(appEnvSchema, process.env);
  const credentials: Record<Account, { user: string; password: string }> = {
    auth: { user: env.DB_AUTH_USER, password: env.DB_AUTH_PASSWORD },
    student: { user: env.DB_STUDENT_USER, password: env.DB_STUDENT_PASSWORD },
    faculty: { user: env.DB_FACULTY_USER, password: env.DB_FACULTY_PASSWORD },
    librarian: { user: env.DB_LIBRARIAN_USER, password: env.DB_LIBRARIAN_PASSWORD },
  };
  return mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    ...credentials[account],
    timezone: "Z",
  });
}
