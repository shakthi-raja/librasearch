"use server";

import { cookies } from "next/headers";
import { changePasswordSchema } from "@/lib/validation/auth";
import { sessionCookie } from "@/server/auth/cookie";
import { requestMeta, requireUser } from "@/server/auth/current";
import { changePassword } from "@/server/services/auth";

type Field = "current" | "next" | "confirm";

export type ChangePasswordState = {
  done?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<Field, string>>;
};

export async function changePasswordAction(
  _previous: ChangePasswordState,
  form: FormData,
): Promise<ChangePasswordState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    current: form.get("current") ?? "",
    next: form.get("next") ?? "",
    confirm: form.get("confirm") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: ChangePasswordState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as Field;
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const result = await changePassword(
    user.userId,
    parsed.data.current,
    parsed.data.next,
    await requestMeta(),
  );
  if (!result.ok) {
    return result.reason === "WRONG_PASSWORD"
      ? { fieldErrors: { current: "Current password is incorrect" } }
      : { fieldErrors: { next: "Choose a password you have not used here" } };
  }
  (await cookies()).set(sessionCookie(result.token, result.expiresAt));
  return { done: true };
}
