"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/forms/action-form";
import { aliasSchema } from "@/lib/validation/aliases";
import { requireUser } from "@/server/auth/current";
import { removeAlias, saveAlias } from "@/server/services/aliases";

export async function saveAliasAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("LIBRARIAN");
  const parsed = aliasSchema.safeParse({
    alias: form.get("alias") ?? "",
    expansion: form.get("expansion") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Check the alias.", fieldErrors };
  }
  await saveAlias(parsed.data, user.userId);
  revalidatePath("/admin/search");
  return { ok: `Searches for "${parsed.data.alias}" now look for ${parsed.data.expansion}.` };
}

export async function removeAliasAction(form: FormData) {
  const user = await requireUser("LIBRARIAN");
  const alias = String(form.get("alias") ?? "");
  if (alias) await removeAlias(alias, user.userId);
  revalidatePath("/admin/search");
}
