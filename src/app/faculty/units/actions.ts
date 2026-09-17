"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/current";
import { AppError } from "@/server/http/errors";
import { suggestChapters } from "@/server/services/faculty";

export type UnitState = { ok?: string; error?: string };

export async function suggestAction(_: UnitState, form: FormData): Promise<UnitState> {
  const user = await requireUser("FACULTY");
  const unitId = Number(form.get("unitId"));
  if (!Number.isInteger(unitId) || unitId <= 0) {
    return { error: "That unit could not be found." };
  }

  try {
    const count = await suggestChapters(unitId, user.userId);
    revalidatePath("/faculty/units");
    return {
      ok:
        count === 0
          ? "No chapters were close enough to suggest."
          : `${count} ${count === 1 ? "chapter" : "chapters"} suggested.`,
    };
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    return { error: "The suggestions could not be computed." };
  }
}
