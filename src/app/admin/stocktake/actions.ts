"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BAYS } from "@/components/stack-map/layout";
import { requireUser } from "@/server/auth/current";
import { AppError } from "@/server/http/errors";
import {
  closeStocktake,
  recordStockScan,
  type ScanOutcome,
  startStocktake,
} from "@/server/services/stocktake";

const RACKS = new Set(BAYS.flatMap((bay) => bay.racks.map((rack) => rack.code)));

export async function startStocktakeAction(form: FormData) {
  const user = await requireUser("LIBRARIAN");
  const rack = String(form.get("rack") ?? "");
  if (!RACKS.has(rack)) redirect("/admin/stocktake");
  const id = await startStocktake(rack, user.userId);
  redirect(`/admin/stocktake/${id}`);
}

export type ScanResult = { ok: true; outcome: ScanOutcome } | { ok: false; error: string };

export async function stockScanAction(stocktakeId: number, barcode: string): Promise<ScanResult> {
  await requireUser("LIBRARIAN");
  try {
    const outcome = await recordStockScan(stocktakeId, barcode);
    revalidatePath(`/admin/stocktake/${stocktakeId}`);
    return { ok: true, outcome };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function closeStocktakeAction(form: FormData) {
  const user = await requireUser("LIBRARIAN");
  const id = Number(form.get("stocktakeId"));
  await closeStocktake(id, user.userId, form.get("markLost") === "on");
  revalidatePath(`/admin/stocktake/${id}`);
  revalidatePath("/admin/stocktake");
}
