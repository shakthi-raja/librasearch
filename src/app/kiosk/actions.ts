"use server";

import type { DeskReceipt } from "@/lib/circulation/types";
import { env } from "@/lib/config/env";
import { verifyCardToken } from "@/server/auth/card";
import { requireUser } from "@/server/auth/current";
import { pool } from "@/server/db/pool";
import { AppError } from "@/server/http/errors";
import { log } from "@/server/log";
import { findMember } from "@/server/repositories/circulation";
import { issueCopy, returnCopy } from "@/server/services/circulation";

export type KioskMember = { name: string; activeLoans: number; maxLoans: number };

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function cardHolder(token: string): Result<string> {
  const check = verifyCardToken(token, env().CARD_SECRET);
  if (check.ok) return { ok: true, value: check.universityId };
  return {
    ok: false,
    error:
      check.reason === "EXPIRED"
        ? "That card code has expired. Open your library card again and rescan it."
        : "That is not a library card from this library.",
  };
}

async function guarded<T>(work: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await work() };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    log.error({ err: error }, "kiosk action failed");
    return { ok: false, error: "Something went wrong. Please ask at the desk." };
  }
}

/** The kiosk only ever borrows for the holder of a freshly scanned card. */
export async function kioskCardAction(token: string): Promise<Result<KioskMember>> {
  await requireUser("LIBRARIAN");
  const holder = cardHolder(token);
  if (!holder.ok) return holder;
  return guarded(async () => {
    const member = await findMember(pool("librarian"), holder.value);
    if (member?.status !== "ACTIVE") {
      throw new AppError("FORBIDDEN", "This card cannot borrow. Please ask at the desk.");
    }
    return {
      name: member.fullName.split(" ")[0] ?? member.fullName,
      activeLoans: member.activeLoans,
      maxLoans: member.maxLoans,
    };
  });
}

export async function kioskIssueAction(
  token: string,
  barcode: string,
): Promise<Result<DeskReceipt>> {
  const kiosk = await requireUser("LIBRARIAN");
  const holder = cardHolder(token);
  if (!holder.ok) return holder;
  return guarded(() =>
    issueCopy({ memberIdentifier: holder.value, barcode, actorId: kiosk.userId }),
  );
}

export async function kioskReturnAction(barcode: string): Promise<Result<DeskReceipt>> {
  const kiosk = await requireUser("LIBRARIAN");
  return guarded(() => returnCopy({ barcode, actorId: kiosk.userId }));
}
