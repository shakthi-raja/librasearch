"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { FormState } from "@/components/forms/action-form";
import { noticeSchema } from "@/lib/validation/notices";
import { requireUser } from "@/server/auth/current";
import { sendNotice } from "@/server/services/notices";

function fields(form: FormData) {
  return Object.fromEntries(
    [...form.entries()].map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
}

function invalid(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { error: "Some fields need attention.", fieldErrors };
}

export async function sendNoticeAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("LIBRARIAN");
  const parsed = noticeSchema.safeParse(fields(form));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const recipients = await sendNotice(parsed.data, user.userId);
    revalidatePath("/admin/notices");
    return { ok: `Notice sent to ${recipients} ${recipients === 1 ? "person" : "people"}.` };
  } catch {
    return { error: "The notice could not be sent." };
  }
}
