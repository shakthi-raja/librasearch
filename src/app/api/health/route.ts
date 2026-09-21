import { pool } from "@/server/db/pool";

/** Readiness for the container: the process answers and the database is up. */
export async function GET() {
  try {
    await pool("librarian").query("SELECT 1");
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
