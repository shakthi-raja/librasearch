"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import type { FormState } from "@/components/forms/action-form";
import { bookSchema, copySchema, copyStateSchema, editionSchema } from "@/lib/validation/catalog";
import { requireUser } from "@/server/auth/current";
import { mapDbError } from "@/server/db/errors";
import { pool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import * as repo from "@/server/repositories/admin-catalog";

export type { FormState };

function fields(form: FormData) {
  return Object.fromEntries(
    [...form.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]),
  );
}

function invalid(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { error: "Some fields need attention.", fieldErrors };
}

const bookId = (form: FormData) => Number(form.get("bookId"));

function refresh(id: number) {
  revalidatePath(`/admin/catalog/${id}`);
  revalidatePath("/admin/catalog");
  revalidatePath("/catalog");
}

export async function createBookAction(_: FormState, form: FormData): Promise<FormState> {
  await requireUser("LIBRARIAN");
  const parsed = bookSchema.safeParse(fields(form));
  if (!parsed.success) return invalid(parsed.error);
  let id: number;
  try {
    id = await withTransaction(pool("librarian"), (conn) => repo.insertBook(conn, parsed.data));
  } catch (error) {
    return { error: mapDbError(error).message };
  }
  refresh(id);
  redirect(`/admin/catalog/${id}` as Route);
}

export async function updateBookAction(_: FormState, form: FormData): Promise<FormState> {
  await requireUser("LIBRARIAN");
  const parsed = bookSchema.safeParse(fields(form));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await withTransaction(pool("librarian"), (conn) =>
      repo.updateBook(conn, bookId(form), parsed.data),
    );
  } catch (error) {
    return { error: mapDbError(error).message };
  }
  refresh(bookId(form));
  return { ok: "Saved." };
}

export async function setBookStatusAction(_: FormState, form: FormData): Promise<FormState> {
  await requireUser("LIBRARIAN");
  const status = form.get("status") === "WITHDRAWN" ? "WITHDRAWN" : "ACTIVE";
  try {
    await repo.setBookStatus(pool("librarian"), bookId(form), status);
  } catch (error) {
    return { error: mapDbError(error).message };
  }
  refresh(bookId(form));
  return { ok: status === "WITHDRAWN" ? "Withdrawn. History is kept." : "Back in the catalogue." };
}

export async function addEditionAction(_: FormState, form: FormData): Promise<FormState> {
  await requireUser("LIBRARIAN");
  const parsed = editionSchema.safeParse({
    ...fields(form),
    publisherId: form.get("publisherId") || null,
  });
  if (!parsed.success) return invalid(parsed.error);
  try {
    await withTransaction(pool("librarian"), (conn) =>
      repo.insertEdition(conn, bookId(form), parsed.data),
    );
  } catch (error) {
    return { error: mapDbError(error).message };
  }
  refresh(bookId(form));
  return { ok: "Edition added." };
}

export async function addCopiesAction(_: FormState, form: FormData): Promise<FormState> {
  await requireUser("LIBRARIAN");
  const parsed = copySchema.safeParse(fields(form));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await withTransaction(pool("librarian"), (conn) => repo.insertCopies(conn, parsed.data));
  } catch (error) {
    return { error: mapDbError(error).message };
  }
  refresh(bookId(form));
  return { ok: `${parsed.data.count} ${parsed.data.count === 1 ? "copy" : "copies"} added.` };
}

export async function updateCopyAction(_: FormState, form: FormData): Promise<FormState> {
  await requireUser("LIBRARIAN");
  const parsed = copyStateSchema.safeParse(fields(form));
  if (!parsed.success) return invalid(parsed.error);
  try {
    const changed = await repo.updateCopyState(
      pool("librarian"),
      parsed.data.copyId,
      parsed.data.status,
      parsed.data.loanPolicy,
    );
    if (!changed)
      return { error: "This copy is on loan or held for someone. Change it at the desk." };
  } catch (error) {
    return { error: mapDbError(error).message };
  }
  refresh(bookId(form));
  return { ok: "Copy updated." };
}
