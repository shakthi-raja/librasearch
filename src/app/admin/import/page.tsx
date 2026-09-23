import type { Metadata } from "next";
import { ImportForm } from "@/components/admin/import-form";
import { PageHeader } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth/current";

export const metadata: Metadata = { title: "Import" };

export default async function ImportPage() {
  await requireUser("LIBRARIAN");

  return (
    <>
      <PageHeader
        title="CSV import"
        description="Add a batch of books from a spreadsheet, after checking every row."
      />

      <section aria-labelledby="format-heading" className="mb-[var(--space-lg)] max-w-[62ch]">
        <h2 id="format-heading" className="mb-[var(--space-xs)] text-lg">
          What the file needs
        </h2>
        <p className="text-muted text-sm">
          A header row with <code>title</code>, <code>authors</code>, <code>isbn13</code> and{" "}
          <code>category</code>. Separate several authors with semicolons. Add <code>copies</code>{" "}
          (1 to 20) and <code>year</code> when you have them. Category is matched by name or slug.
          Nothing is written until you press Import.
        </p>
      </section>

      <ImportForm />
    </>
  );
}
