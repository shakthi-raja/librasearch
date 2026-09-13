"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { FormState } from "@/components/forms/action-form";
import { courseSchema, offeringSchema, termSchema } from "@/lib/validation/academic";
import { requireUser } from "@/server/auth/current";
import { mapDbError } from "@/server/db/errors";
import {
  createCourse,
  createOffering,
  createTerm,
  makeCurrentTerm,
} from "@/server/services/academic";

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

export async function createTermAction(_: FormState, form: FormData): Promise<FormState> {
  await requireUser("LIBRARIAN");
  const parsed = termSchema.safeParse(fields(form));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await createTerm(parsed.data);
    revalidatePath("/admin/academic");
    return { ok: "Term added." };
  } catch (error) {
    return { error: mapDbError(error).message };
  }
}

export async function makeCurrentTermAction(form: FormData): Promise<void> {
  await requireUser("LIBRARIAN");
  const termId = Number(form.get("termId"));
  if (!Number.isInteger(termId) || termId <= 0) return;
  await makeCurrentTerm(termId);
  revalidatePath("/admin/academic");
}

export async function createCourseAction(_: FormState, form: FormData): Promise<FormState> {
  await requireUser("LIBRARIAN");
  const parsed = courseSchema.safeParse(fields(form));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await createCourse(parsed.data);
    revalidatePath("/admin/academic");
    return { ok: "Course added." };
  } catch (error) {
    return { error: mapDbError(error).message };
  }
}

export async function createOfferingAction(_: FormState, form: FormData): Promise<FormState> {
  await requireUser("LIBRARIAN");
  const parsed = offeringSchema.safeParse(fields(form));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await createOffering(parsed.data);
    revalidatePath("/admin/academic");
    return { ok: "Offering added." };
  } catch (error) {
    return { error: mapDbError(error).message };
  }
}
