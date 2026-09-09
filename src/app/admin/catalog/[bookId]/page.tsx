import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, Field } from "@/components/forms/action-form";
import { BAYS } from "@/components/stack-map/layout";
import { pool } from "@/server/db/pool";
import {
  categoryOptions,
  findBookAdmin,
  publisherOptions,
} from "@/server/repositories/admin-catalog";
import {
  addCopiesAction,
  addEditionAction,
  setBookStatusAction,
  updateBookAction,
  updateCopyAction,
} from "../actions";
import { BookFields } from "../book-form";

export const metadata: Metadata = { title: "Edit book" };

const RACKS = BAYS.flatMap((b) => b.racks.map((r) => r.code));
const SHELVES = ["S1", "S2", "S3", "S4", "S5", "S6"];
const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "On the shelf",
  ON_LOAN: "On loan",
  ON_HOLD_SHELF: "On the hold shelf",
  DAMAGED: "Damaged",
  LOST: "Lost",
  WITHDRAWN: "Withdrawn",
};
const POLICY_LABEL: Record<string, string> = {
  REGULAR: "Regular",
  SHORT_LOAN: "Short loan",
  REFERENCE_ONLY: "Reference only",
};

export default async function EditBookPage({ params }: PageProps<"/admin/catalog/[bookId]">) {
  const id = Number((await params).bookId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const db = pool("librarian");
  const [book, categories, publishers] = await Promise.all([
    findBookAdmin(db, id),
    categoryOptions(db),
    publisherOptions(db),
  ]);
  if (!book) notFound();

  return (
    <div className="grid gap-[var(--space-2xl)]">
      <div className="grid gap-[var(--space-xs)]">
        <Link href="/admin/catalog" className="text-sm text-muted">
          Catalogue
        </Link>
        <h1>{book.title}</h1>
        {book.status === "ACTIVE" ? (
          <Link href={`/catalog/${book.bookId}`} className="text-sm">
            View the public page
          </Link>
        ) : (
          <p className="chip justify-self-start">
            Withdrawn: hidden from the catalogue, history kept
          </p>
        )}
      </div>

      <section aria-labelledby="details" className="grid gap-[var(--space-md)]">
        <h2 id="details">Details</h2>
        <ActionForm
          action={updateBookAction}
          submitLabel="Save details"
          className="grid max-w-[56rem] gap-[var(--space-md)]"
        >
          <input type="hidden" name="bookId" value={book.bookId} />
          <BookFields book={book} categories={categories} />
        </ActionForm>
        <ActionForm
          action={setBookStatusAction}
          submitLabel={book.status === "ACTIVE" ? "Withdraw this book" : "Return to the catalogue"}
          quiet
        >
          <input type="hidden" name="bookId" value={book.bookId} />
          <input
            type="hidden"
            name="status"
            value={book.status === "ACTIVE" ? "WITHDRAWN" : "ACTIVE"}
          />
          {book.status === "ACTIVE" ? (
            <p className="text-sm text-muted">
              Withdrawing hides the book from readers. Loans, holds and fines stay on record.
            </p>
          ) : null}
        </ActionForm>
      </section>

      <section aria-labelledby="editions" className="grid gap-[var(--space-lg)]">
        <h2 id="editions">Editions and copies</h2>
        {book.editions.map((edition) => (
          <div key={edition.editionId} className="grid gap-[var(--space-sm)]">
            <h3>
              Edition {edition.editionNo}, {edition.pubYear}{" "}
              <span className="figure text-sm text-muted">{edition.isbn13}</span>
            </h3>
            {edition.copies.length === 0 ? (
              <p className="text-sm text-muted">No copies of this edition yet.</p>
            ) : (
              <ul className="ruled">
                {edition.copies.map((copy) => (
                  <li key={copy.copyId} className="py-[var(--space-xs)]">
                    <ActionForm
                      action={updateCopyAction}
                      submitLabel="Update"
                      quiet
                      className="flex flex-wrap items-end gap-[var(--space-sm)]"
                    >
                      <input type="hidden" name="bookId" value={book.bookId} />
                      <input type="hidden" name="copyId" value={copy.copyId} />
                      <span className="figure min-w-[13rem] text-sm">
                        {copy.barcode}{" "}
                        <span className="text-muted">
                          {copy.rack} {copy.shelf}
                        </span>
                      </span>
                      {copy.status === "ON_LOAN" || copy.status === "ON_HOLD_SHELF" ? (
                        <span className="chip">{STATUS_LABEL[copy.status]}</span>
                      ) : (
                        <>
                          <Field label="State">
                            <select name="status" defaultValue={copy.status} className="select">
                              {["AVAILABLE", "DAMAGED", "LOST", "WITHDRAWN"].map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABEL[s]}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Lending">
                            <select
                              name="loanPolicy"
                              defaultValue={copy.loanPolicy}
                              className="select"
                            >
                              {Object.entries(POLICY_LABEL).map(([v, l]) => (
                                <option key={v} value={v}>
                                  {l}
                                </option>
                              ))}
                            </select>
                          </Field>
                        </>
                      )}
                    </ActionForm>
                  </li>
                ))}
              </ul>
            )}
            <ActionForm
              action={addCopiesAction}
              submitLabel="Add copies"
              quiet
              className="flex flex-wrap items-end gap-[var(--space-sm)]"
            >
              <input type="hidden" name="bookId" value={book.bookId} />
              <input type="hidden" name="editionId" value={edition.editionId} />
              <Field label="How many">
                <input
                  name="count"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={1}
                  className="input w-20"
                />
              </Field>
              <Field label="Rack">
                <select name="rack" className="select" defaultValue={edition.copies[0]?.rack ?? ""}>
                  {RACKS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Shelf">
                <select name="shelf" className="select">
                  {SHELVES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Lending">
                <select name="loanPolicy" className="select">
                  {Object.entries(POLICY_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </ActionForm>
          </div>
        ))}

        <div className="grid gap-[var(--space-sm)] border-t border-ink pt-[var(--space-md)]">
          <h3>Add an edition</h3>
          <ActionForm
            action={addEditionAction}
            submitLabel="Add edition"
            className="grid max-w-[56rem] gap-[var(--space-sm)]"
          >
            <input type="hidden" name="bookId" value={book.bookId} />
            <div className="grid gap-[var(--space-sm)] sm:grid-cols-3">
              <Field label="ISBN-13">
                <input name="isbn13" required inputMode="numeric" className="input figure" />
              </Field>
              <Field label="Edition number">
                <input name="editionNo" type="number" min={1} max={50} required className="input" />
              </Field>
              <Field label="Year">
                <input
                  name="pubYear"
                  type="number"
                  min={1900}
                  max={2100}
                  required
                  className="input"
                />
              </Field>
              <Field label="Pages">
                <input
                  name="pageCount"
                  type="number"
                  min={1}
                  max={5000}
                  required
                  className="input"
                />
              </Field>
              <Field label="Publisher">
                <select name="publisherId" className="select" defaultValue="">
                  <option value="">Not recorded</option>
                  {publishers.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Binding">
                <select name="format" className="select">
                  <option value="PAPERBACK">Paperback</option>
                  <option value="HARDCOVER">Hardcover</option>
                </select>
              </Field>
            </div>
          </ActionForm>
        </div>
      </section>
    </div>
  );
}
