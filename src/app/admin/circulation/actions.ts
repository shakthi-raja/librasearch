"use server";

import { revalidatePath } from "next/cache";
import type { DeskReceipt } from "@/lib/circulation/types";
import { env } from "@/lib/config/env";
import { issueSchema, returnSchema } from "@/lib/validation/circulation";
import { verifyCardToken } from "@/server/auth/card";
import { requireUser } from "@/server/auth/current";
import { AppError } from "@/server/http/errors";
import { log } from "@/server/log";
import { issueCopy, returnCopy } from "@/server/services/circulation";

export type DeskState = {
  receipt?: DeskReceipt;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  return errors;
}

export async function deskAction(_: DeskState, form: FormData): Promise<DeskState> {
  const user = await requireUser("LIBRARIAN");
  const mode = text(form, "mode") === "return" ? "return" : "issue";

  try {
    if (mode === "return") {
      const parsed = returnSchema.safeParse({ barcode: text(form, "barcode") });
      if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
      const receipt = await returnCopy({ barcode: parsed.data.barcode, actorId: user.userId });
      revalidatePath("/admin/circulation");
      revalidatePath("/admin");
      return { receipt };
    }

    const parsed = issueSchema.safeParse({
      member: text(form, "member"),
      barcode: text(form, "barcode"),
    });
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

    const receipt = await issueCopy({
      memberIdentifier: parsed.data.member,
      barcode: parsed.data.barcode,
      actorId: user.userId,
    });
    revalidatePath("/admin/circulation");
    revalidatePath("/admin");
    return { receipt };
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    log.error({ err: error, mode }, "desk action failed");
    return { error: "The desk could not complete that. Try again." };
  }
}

export type CardResult = { universityId: string } | { error: string };

/** Turns a scanned library card into the member it belongs to, if it is genuine and fresh. */
export async function resolveCardAction(token: string): Promise<CardResult> {
  await requireUser("LIBRARIAN");
  const check = verifyCardToken(token, env().CARD_SECRET);
  if (check.ok) return { universityId: check.universityId };
  return {
    error:
      check.reason === "EXPIRED"
        ? "That card code has expired. Ask the member to open their card again."
        : "That is not a valid library card.",
  };
}
