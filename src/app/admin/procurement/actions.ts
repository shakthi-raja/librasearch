"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { FormState } from "@/components/forms/action-form";
import { decisionSchema, purchaseRequestSchema } from "@/lib/validation/procurement";
import { requireUser } from "@/server/auth/current";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { AppError } from "@/server/http/errors";
import { decideRequest, insertRequest } from "@/server/repositories/procurement";

export type { FormState };

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

export async function createRequestAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("LIBRARIAN");
  const parsed = purchaseRequestSchema.safeParse(fields(form));
  if (!parsed.success) return invalid(parsed.error);

  try {
    await withTransaction(pool("librarian"), (conn) =>
      insertRequest(conn, parsed.data, user.userId),
    );
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    return { error: "The request could not be saved." };
  }
  revalidatePath("/admin/procurement");
  return { ok: "Request logged for review." };
}

export async function decideAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("LIBRARIAN");
  const parsed = decisionSchema.safeParse(fields(form));
  if (!parsed.success) return invalid(parsed.error);

  try {
    await withTransaction(pool("librarian"), (conn) =>
      decideRequest(conn, parsed.data, user.userId),
    );
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    return { error: "The decision could not be saved." };
  }
  revalidatePath("/admin/procurement");
  return { ok: parsed.data.decision === "APPROVED" ? "Approved to order." : "Rejected." };
}
