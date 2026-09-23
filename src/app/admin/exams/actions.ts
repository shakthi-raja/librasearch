"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/current";
import { AppError } from "@/server/http/errors";
import { applyExamPolicy, type ExamPolicy, revertExamPolicy } from "@/server/services/exam-policy";

export type PolicyState = { ok?: string; error?: string };

const POLICIES: ExamPolicy[] = ["SHORT_LOAN", "REFERENCE_ONLY"];

const label = (policy: ExamPolicy) => (policy === "SHORT_LOAN" ? "short loan" : "reference only");

function readExam(form: FormData) {
  const examId = Number(form.get("examId"));
  return Number.isInteger(examId) && examId > 0 ? examId : null;
}

export async function applyAction(_: PolicyState, form: FormData): Promise<PolicyState> {
  const user = await requireUser("LIBRARIAN");
  const examId = readExam(form);
  const policy = String(form.get("policy")) as ExamPolicy;
  if (examId === null || !POLICIES.includes(policy)) {
    return { error: "That exam window could not be found." };
  }

  try {
    const result = await applyExamPolicy(examId, policy, user.userId);
    revalidatePath("/admin/exams");
    revalidatePath("/admin/demand");
    const changed = `${result.applied} ${result.applied === 1 ? "copy" : "copies"} on ${label(policy)}`;
    const left = result.skipped > 0 ? `, ${result.skipped} left as they were` : "";
    return { ok: `${changed}${left}.` };
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    return { error: "The exam policy could not be applied." };
  }
}

export async function revertAction(_: PolicyState, form: FormData): Promise<PolicyState> {
  const user = await requireUser("LIBRARIAN");
  const examId = readExam(form);
  if (examId === null) return { error: "That exam window could not be found." };

  try {
    const restored = await revertExamPolicy(examId, user.userId);
    revalidatePath("/admin/exams");
    revalidatePath("/admin/demand");
    return { ok: `${restored} ${restored === 1 ? "copy" : "copies"} back to their earlier rule.` };
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    return { error: "The exam policy could not be reverted." };
  }
}
