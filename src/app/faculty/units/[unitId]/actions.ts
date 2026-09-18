"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/current";
import { reviewMapping } from "@/server/services/faculty";

export async function reviewAction(form: FormData): Promise<void> {
  const user = await requireUser("FACULTY");
  const unitId = Number(form.get("unitId"));
  const chapterId = Number(form.get("chapterId"));
  const status = form.get("status");

  if (!Number.isInteger(unitId) || !Number.isInteger(chapterId)) return;
  if (status !== "APPROVED" && status !== "REJECTED") return;

  await reviewMapping(unitId, chapterId, status, user.userId);
  revalidatePath(`/faculty/units/${unitId}`);
  revalidatePath("/faculty/units");
  revalidatePath("/faculty/coverage");
}
