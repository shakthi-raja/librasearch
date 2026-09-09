import type { Metadata } from "next";
import { ActionForm } from "@/components/forms/action-form";
import { PageHeader } from "@/components/layout/app-shell";
import { pool } from "@/server/db/pool";
import { categoryOptions } from "@/server/repositories/admin-catalog";
import { createBookAction } from "../actions";
import { BookFields } from "../book-form";

export const metadata: Metadata = { title: "Add a book" };

export default async function NewBookPage() {
  const categories = await categoryOptions(pool("librarian"));
  return (
    <>
      <PageHeader
        title="Add a book"
        description="Add the work first; editions and copies follow on its page."
      />
      <ActionForm
        action={createBookAction}
        submitLabel="Add book"
        className="grid max-w-[56rem] gap-[var(--space-md)]"
      >
        <BookFields categories={categories} />
      </ActionForm>
    </>
  );
}
