import type { Metadata } from "next";
import { DecisionForm } from "@/components/admin/decision-form";
import { ReceiveForm } from "@/components/admin/receive-form";
import { ActionForm, Field } from "@/components/forms/action-form";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { procurementQueue } from "@/server/services/procurement";
import { createRequestAction } from "./actions";

export const metadata: Metadata = { title: "Procurement" };

const STATUS_CHIP: Record<string, string> = {
  APPROVED: "chip chip-in-date",
  REJECTED: "chip chip-error",
  ORDERED: "chip chip-signal",
  RECEIVED: "chip chip-in-date",
};

export default async function ProcurementPage() {
  await requireUser("LIBRARIAN");
  const { pending, decided } = await procurementQueue();

  return (
    <>
      <PageHeader
        title="Procurement"
        description="Requests from teaching staff, checked against the catalogue before anything is ordered."
      />

      <section aria-labelledby="new-request" className="mb-[var(--space-xl)] max-w-[54rem]">
        <h2 id="new-request" className="mb-[var(--space-sm)] text-lg">
          Log a request
        </h2>
        <ActionForm action={createRequestAction} submitLabel="Log request" quiet>
          <div className="grid gap-[var(--space-sm)] md:grid-cols-2">
            <Field label="Title">
              <input name="title" required maxLength={200} className="input" />
            </Field>
            <Field label="Author">
              <input name="author" maxLength={160} className="input" />
            </Field>
            <Field label="ISBN-13">
              <input name="isbn13" maxLength={17} className="input" />
            </Field>
            <Field label="Copies">
              <input
                name="quantity"
                type="number"
                min={1}
                max={50}
                defaultValue={1}
                className="input"
              />
            </Field>
          </div>
          <Field label="Why the library should buy it">
            <textarea name="reason" required rows={3} maxLength={2000} className="input" />
          </Field>
        </ActionForm>
      </section>

      <section aria-labelledby="pending-heading" className="mb-[var(--space-xl)]">
        <h2 id="pending-heading" className="mb-[var(--space-sm)] text-lg">
          Waiting for a decision
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted">Nothing is waiting.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <caption className="sr-only">
                Purchase requests waiting for a decision, with possible catalogue matches
              </caption>
              <thead>
                <tr>
                  <th scope="col">Book</th>
                  <th scope="col">Asked by</th>
                  <th scope="col">Copies</th>
                  <th scope="col">Why</th>
                  <th scope="col">Possible match</th>
                  <th scope="col">Decision</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((row) => (
                  <tr key={row.requestId}>
                    <td>
                      <p className="font-medium">{row.title}</p>
                      <p className="text-muted text-sm">
                        {row.author ?? "Author not given"}
                        {row.isbn13 ? ` · ${row.isbn13}` : ""}
                      </p>
                    </td>
                    <td>
                      <p>{row.requester}</p>
                      <p className="text-muted text-sm">{row.unit ?? "No unit"}</p>
                    </td>
                    <td className="figure">{row.quantity}</td>
                    <td className="max-w-64 text-sm">{row.reason}</td>
                    <td className="max-w-64">
                      {row.duplicates.length === 0 ? (
                        <span className="text-muted text-sm">No close match</span>
                      ) : (
                        <ul className="grid gap-1 text-sm">
                          {row.duplicates.map((duplicate) => (
                            <li key={duplicate.bookId}>
                              <p className="font-medium">{duplicate.title}</p>
                              <p className="text-muted">
                                {duplicate.authors || "Unknown author"}
                                {duplicate.year ? ` · ${duplicate.year}` : ""}
                              </p>
                              <p>
                                {duplicate.reason === "same-isbn"
                                  ? "Same ISBN already catalogued"
                                  : `${Math.round(duplicate.score * 100)}% title match${
                                      duplicate.reason === "same-author" ? ", same author" : ""
                                    }`}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>
                      <DecisionForm requestId={row.requestId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="decided-heading">
        <h2 id="decided-heading" className="mb-[var(--space-sm)] text-lg">
          Recent decisions
        </h2>
        {decided.length === 0 ? (
          <p className="text-muted">No request has been decided yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <caption className="sr-only">Purchase requests already decided</caption>
              <thead>
                <tr>
                  <th scope="col">Book</th>
                  <th scope="col">Status</th>
                  <th scope="col">Asked by</th>
                  <th scope="col">Decided</th>
                  <th scope="col">Note</th>
                  <th scope="col">Receive</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((row) => (
                  <tr key={row.requestId}>
                    <td>
                      <p className="font-medium">{row.title}</p>
                      <p className="text-muted text-sm">{row.author ?? "Unknown author"}</p>
                    </td>
                    <td>
                      <span className={STATUS_CHIP[row.status] ?? "chip"}>{row.status}</span>
                    </td>
                    <td>{row.requester}</td>
                    <td className="text-sm">
                      {formatDateTime(new Date(row.decidedAt ?? row.createdAt))}
                    </td>
                    <td className="max-w-64 text-sm">{row.note ?? "No note"}</td>
                    <td>
                      {row.status === "APPROVED" || row.status === "ORDERED" ? (
                        <ReceiveForm requestId={row.requestId} quantity={row.quantity} />
                      ) : (
                        <span className="text-muted">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
