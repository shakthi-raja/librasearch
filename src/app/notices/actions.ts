"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/current";
import { markNoticeRead } from "@/server/services/notices";

export type NoticeState = { ok?: string; error?: string };

export async function markReadAction(_: NoticeState, form: FormData): Promise<NoticeState> {
  const user = await requireUser("STUDENT", "FACULTY", "LIBRARIAN");
  const noticeId = Number(form.get("noticeId"));
  if (!Number.isInteger(noticeId) || noticeId <= 0) {
    return { error: "That notice could not be found." };
  }
  const read = await markNoticeRead(noticeId, user.userId, user.role);
  revalidatePath("/notices");
  return { ok: read ? "Marked read." : "Already read." };
}
