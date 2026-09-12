"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/current";
import { AppError } from "@/server/http/errors";
import { log } from "@/server/log";
import { renewLoan } from "@/server/services/circulation";

export type RenewState = { error?: string; dueAt?: string };

export async function renewLoanAction(_: RenewState, form: FormData): Promise<RenewState> {
  const user = await requireUser("STUDENT", "FACULTY");
  const loanId = Number(form.get("loanId"));
  if (!Number.isInteger(loanId) || loanId <= 0) {
    return { error: "That loan could not be found." };
  }

  try {
    const due = await renewLoan({ loanId, actorId: user.userId, role: user.role });
    revalidatePath("/student");
    return { dueAt: due.toISOString() };
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    log.error({ err: error, loanId }, "renewal failed");
    return { error: "The renewal could not be completed. Try again." };
  }
}
