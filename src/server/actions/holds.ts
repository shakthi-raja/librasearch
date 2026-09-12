"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/current";
import { AppError } from "@/server/http/errors";
import { log } from "@/server/log";
import { cancelHold, placeHold } from "@/server/services/holds";

export type HoldState = { ok?: string; error?: string };

export async function placeHoldAction(_: HoldState, form: FormData): Promise<HoldState> {
  const user = await requireUser("STUDENT", "FACULTY");
  const bookId = Number(form.get("bookId"));
  if (!Number.isInteger(bookId) || bookId <= 0) {
    return { error: "That book could not be found." };
  }

  try {
    await placeHold({ bookId, memberId: user.userId, role: user.role });
    revalidatePath("/student");
    revalidatePath(`/catalog/${bookId}`);
    return { ok: "You are in the queue. The hold is on your loans page." };
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    log.error({ err: error, bookId }, "hold placement failed");
    return { error: "The hold could not be placed. Try again." };
  }
}

export async function cancelHoldAction(_: HoldState, form: FormData): Promise<HoldState> {
  const user = await requireUser("STUDENT", "FACULTY", "LIBRARIAN");
  const holdId = Number(form.get("holdId"));
  if (!Number.isInteger(holdId) || holdId <= 0) {
    return { error: "That hold could not be found." };
  }

  try {
    await cancelHold({ holdId, actorId: user.userId, role: user.role });
    revalidatePath("/student");
    revalidatePath("/admin/holds");
    return { ok: "The hold is cancelled." };
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    log.error({ err: error, holdId }, "hold cancellation failed");
    return { error: "The hold could not be cancelled. Try again." };
  }
}
