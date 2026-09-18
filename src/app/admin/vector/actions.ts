"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/current";
import { log } from "@/server/log";
import { runRebuild } from "@/server/services/vector-console";

export type RebuildState = { ok?: string; error?: string };

export async function rebuildAction(_: RebuildState): Promise<RebuildState> {
  await requireUser("LIBRARIAN");
  try {
    const points = await runRebuild();
    revalidatePath("/admin/vector");
    return { ok: `Rebuilt ${points} points.` };
  } catch (error) {
    log.error({ err: error }, "vector rebuild failed");
    return { error: "The rebuild failed. Check the worker log." };
  }
}
