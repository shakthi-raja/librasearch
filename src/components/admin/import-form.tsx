"use client";

import { useActionState } from "react";
import { type ImportState, importAction } from "@/app/admin/import/actions";

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importAction, {});

  return (
    <div className="grid gap-[var(--space-md)]">
      <form action={action} className="flex flex-wrap items-end gap-[var(--space-sm)]">
        <input type="hidden" name="csv" value={state.csv ?? ""} />
        <label className="grid gap-1 text-xs font-medium text-muted">
          CSV file
          <input type="file" name="file" accept=".csv,text/csv" className="input file:mr-2" />
        </label>
        <button type="submit" name="intent" value="preview" className="btn" disabled={pending}>
          {pending ? "Checking" : "Check file"}
        </button>
        <button
          type="submit"
          name="intent"
          value="import"
          className="btn btn-primary"
          disabled={pending}
        >
          Import valid rows
        </button>
      </form>

      {state.error ? (
        <p role="alert" className="text-sm text-error">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-ink-2">
          {state.ok}
        </p>
      ) : null}

      {state.preview && state.preview.rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="table">
            <caption className="sr-only">Rows found in the file and what needs fixing</caption>
            <thead>
              <tr>
                <th scope="col">Line</th>
                <th scope="col">Book</th>
                <th scope="col">ISBN</th>
                <th scope="col">Category</th>
                <th scope="col">Copies</th>
                <th scope="col">Check</th>
              </tr>
            </thead>
            <tbody>
              {state.preview.rows.map((row) => (
                <tr key={row.line}>
                  <td className="figure">{row.line}</td>
                  <td>
                    <p className="font-medium">{row.title || "Missing title"}</p>
                    <p className="text-muted text-sm">{row.authors.join(", ") || "No author"}</p>
                  </td>
                  <td className="text-sm">{row.isbn13 || "No ISBN"}</td>
                  <td className="text-sm">{row.category || "No category"}</td>
                  <td className="figure">{row.copies}</td>
                  <td>
                    {row.issues.length === 0 ? (
                      <span className="chip chip-in-date">Ready</span>
                    ) : (
                      <ul className="grid gap-1 text-sm text-error">
                        {row.issues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
