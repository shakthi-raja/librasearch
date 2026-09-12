import "server-only";
import { pool } from "@/server/db/pool";
import { AppError } from "@/server/http/errors";
import { memberLoans, memberOverview } from "@/server/repositories/member";

/** The signed-in member's own rows. The session id supplies the predicate. */
export async function getMemberDashboard(userId: number) {
  const db = pool("student");
  const overview = await memberOverview(db, userId);
  if (!overview) throw new AppError("NOT_FOUND", "Your account could not be read.");
  const loans = await memberLoans(db, userId);
  return { overview, loans };
}
