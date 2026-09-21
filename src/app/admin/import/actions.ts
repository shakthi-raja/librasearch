"use server";

import { revalidatePath } from "next/cache";
import type { ImportPreview } from "@/lib/catalogue/csv";
import { requireUser } from "@/server/auth/current";
import { importBooks, previewImport } from "@/server/services/import-books";

export type ImportState = { preview?: ImportPreview; ok?: string; error?: string; csv?: string };

const MAX_BYTES = 256 * 1024;

export async function importAction(_: ImportState, form: FormData): Promise<ImportState> {
  const user = await requireUser("LIBRARIAN");
  const intent = String(form.get("intent"));
  const carried = String(form.get("csv") ?? "");
  const file = form.get("file");
  if (carried === "" && (!(file instanceof File) || file.size === 0)) {
    return { error: "Choose a CSV file first." };
  }
  if (carried === "" && file instanceof File && file.size > MAX_BYTES) {
    return { error: "Keep the file under 256 KB." };
  }

  const text = carried !== "" ? carried : await (file as File).text();
  try {
    if (intent === "import") {
      const result = await importBooks(text, user.userId);
      const preview = await previewImport(text);
      revalidatePath("/admin/import");
      revalidatePath("/admin/catalog");
      return {
        preview,
        csv: text,
        ok: `Imported ${result.imported} ${result.imported === 1 ? "book" : "books"}${
          result.skipped > 0 ? `; ${result.skipped} rows stayed out` : ""
        }.`,
      };
    }
    const preview = await previewImport(text);
    if (preview.error) return { error: preview.error };
    return {
      preview,
      csv: text,
      ok: `${preview.valid} ready, ${preview.invalid} need attention.`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The file could not be read." };
  }
}
