import type { Metadata } from "next";
import { ActionForm, Field } from "@/components/forms/action-form";
import { PageHeader } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth/current";
import { listAliases } from "@/server/search/aliases";
import { removeAliasAction, saveAliasAction } from "./actions";

export const metadata: Metadata = { title: "Search" };

export default async function SearchSettingsPage() {
  await requireUser("LIBRARIAN");
  const aliases = await listAliases();

  return (
    <>
      <PageHeader
        title="Search"
        description="Abbreviations students type, and what search should look for instead."
      />

      <section aria-labelledby="alias-form-heading" className="mb-[var(--space-2xl)] max-w-[44rem]">
        <h2 id="alias-form-heading" className="mb-[var(--space-sm)] text-lg">
          Add or change an alias
        </h2>
        <ActionForm action={saveAliasAction} submitLabel="Save alias">
          <div className="grid gap-[var(--space-sm)] sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
            <Field label="Alias">
              <input
                name="alias"
                className="input w-full"
                placeholder="cn"
                required
                maxLength={40}
              />
            </Field>
            <Field label="Stands for">
              <input
                name="expansion"
                className="input w-full"
                placeholder="computer networks"
                required
                maxLength={200}
              />
            </Field>
          </div>
        </ActionForm>
      </section>

      <section aria-labelledby="alias-list-heading" className="grid gap-[var(--space-sm)]">
        <h2 id="alias-list-heading" className="text-lg">
          {aliases.length} aliases
        </h2>
        <table className="table max-w-[54rem]">
          <thead>
            <tr>
              <th scope="col">Alias</th>
              <th scope="col">Stands for</th>
              <th scope="col">Added by</th>
              <th scope="col">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {aliases.map((row) => (
              <tr key={row.alias}>
                <td className="figure">{row.alias}</td>
                <td>{row.expansion}</td>
                <td className="text-sm text-muted">
                  {row.source === "SEEDED" ? "Syllabus" : "Library"}
                </td>
                <td className="text-right align-middle">
                  <form action={removeAliasAction}>
                    <input type="hidden" name="alias" value={row.alias} />
                    <button
                      type="submit"
                      className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
                      aria-label={`Remove alias ${row.alias}`}
                    >
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
