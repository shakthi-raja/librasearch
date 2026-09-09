"use server";

import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signInSchema } from "@/lib/validation/auth";
import { sessionCookie } from "@/server/auth/cookie";
import { HOME_BY_ROLE, requestMeta } from "@/server/auth/current";
import { signIn } from "@/server/services/auth";

export type SignInState = {
  error?: string;
  fieldErrors?: Partial<Record<"identifier" | "password", string>>;
  identifier?: string;
};

/** Only same-site relative paths are honoured, so ?next= cannot redirect off site. */
function safeNext(value: FormDataEntryValue | null): Route | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  return value as Route;
}

export async function signInAction(_previous: SignInState, form: FormData): Promise<SignInState> {
  const identifier = String(form.get("identifier") ?? "");
  const parsed = signInSchema.safeParse({ identifier, password: form.get("password") ?? "" });
  if (!parsed.success) {
    const fieldErrors: SignInState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if ((key === "identifier" || key === "password") && !fieldErrors[key])
        fieldErrors[key] = issue.message;
    }
    return { fieldErrors, identifier };
  }

  const result = await signIn(parsed.data, await requestMeta());
  if (!result.ok) {
    const minutes = result.reason === "THROTTLED" ? Math.ceil(result.retryAfterSeconds / 60) : 0;
    const error = {
      INVALID: "University ID, email or password is incorrect.",
      INACTIVE: "This account is not active. Please contact the library desk.",
      THROTTLED: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    }[result.reason];
    return { identifier, error };
  }

  (await cookies()).set(sessionCookie(result.token, result.expiresAt));
  redirect(safeNext(form.get("next")) ?? HOME_BY_ROLE[result.user.role]);
}
