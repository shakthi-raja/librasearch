"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/current";
import { AppError } from "@/server/http/errors";
import { log } from "@/server/log";
import { settleFineRecord } from "@/server/services/fines";

export type FineState = { ok?: string; error?: string };

const schema = z
  .object({
    action: z.enum(["PAID", "WAIVED"]),
    reason: z.string().trim().max(300).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "WAIVED" && (value.reason?.length ?? 0) < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Give a waiver reason of at least 5 characters.",
      });
    }
  });

export async function settleFineAction(_: FineState, form: FormData): Promise<FineState> {
  const user = await requireUser("LIBRARIAN");
  const fineId = Number(form.get("fineId"));
  if (!Number.isInteger(fineId) || fineId <= 0) {
    return { error: "That fine could not be found." };
  }

  const reason = form.get("reason");
  const parsed = schema.safeParse({
    action: form.get("action"),
    reason: typeof reason === "string" ? reason : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the settlement fields." };
  }

  try {
    await settleFineRecord({
      fineId,
      action: parsed.data.action,
      reason: parsed.data.reason ?? null,
      actorId: user.userId,
    });
    revalidatePath("/admin/fines");
    revalidatePath("/student");
    return { ok: parsed.data.action === "PAID" ? "Payment recorded." : "Fine waived." };
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    log.error({ err: error, fineId }, "fine settlement failed");
    return { error: "The settlement could not be recorded. Try again." };
  }
}
