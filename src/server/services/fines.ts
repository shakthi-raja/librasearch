import "server-only";
import { pool } from "@/server/db/pool";
import { listFines, settleFine } from "@/server/repositories/fines";

export function getFines() {
  return listFines(pool("librarian"));
}

export function settleFineRecord(input: {
  fineId: number;
  action: "PAID" | "WAIVED";
  reason: string | null;
  actorId: number;
}) {
  return settleFine(pool("librarian"), input);
}
