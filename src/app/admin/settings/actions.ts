"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { FormState } from "@/components/forms/action-form";
import { settingsSchema } from "@/lib/validation/settings";
import { requireUser } from "@/server/auth/current";
import { updateSettings } from "@/server/services/settings";

function fields(form: FormData) {
  return Object.fromEntries(
    [...form.entries()].map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
}

function invalid(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { error: "Some settings need attention.", fieldErrors };
}

export async function settingsAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("LIBRARIAN");
  const parsed = settingsSchema.safeParse(fields(form));
  if (!parsed.success) return invalid(parsed.error);

  try {
    await updateSettings(parsed.data, user.userId);
  } catch {
    return { error: "The settings could not be saved." };
  }
  revalidatePath("/admin/settings");
  return { ok: "Settings saved." };
}
