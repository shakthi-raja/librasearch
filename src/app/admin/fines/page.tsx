import type { Metadata } from "next";
import { SettleFineForm } from "@/components/fines/settle-form";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDate, formatMoney } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { getFines } from "@/server/services/fines";

export const metadata: Metadata = { title: "Fines" };

export default async function FinesPage() {
  await requireUser("LIBRARIAN");
  const fines = await getFines();
  const unpaid = fines.filter((fine) => fine.status === "UNPAID");
  const settled = fines.filter((fine) => fine.status !== "UNPAID");
  const total = unpaid.reduce((sum, fine) => sum + Number(fine.amount), 0);

  return (
    <>
      <PageHeader
        title="Fines"
        description="Unpaid amounts with the member, the copy and the days late. Every payment and waiver is audited."
      />

      <section aria-labelledby="unpaid-heading" className="grid gap-[var(--space-sm)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="unpaid-heading" className="text-lg">
            Unpaid
          </h2>
          <p className="figure text-sm text-ink-2">{formatMoney(total)} outstanding</p>
        </div>

        {unpaid.length === 0 ? (
          <p className="text-muted">No unpaid fines.</p>
        ) : (
          <ul className="ruled">
            {unpaid.map((fine) => (
              <li
                key={fine.fineId}
                className="grid gap-[var(--space-sm)] py-[var(--space-lg)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] lg:items-start lg:gap-[var(--space-lg)]"
              >
                <div className="min-w-0">
                  <h3 className="text-lg">{fine.title}</h3>
                  <p className="text-sm text-muted">
                    {fine.memberName} / <span className="figure">{fine.universityId}</span>
                  </p>
                  <p className="figure text-sm">
                    {fine.barcode} / Edition {fine.editionNo}
                  </p>
                </div>
                <div>
                  <p className="figure text-lg">{formatMoney(fine.amount)}</p>
                  <p className="text-sm text-muted">
                    {fine.daysOverdue} {fine.daysOverdue === 1 ? "day" : "days"} late
                  </p>
                  <p className="text-sm text-muted">
                    Raised <span className="figure">{formatDate(fine.createdAt)}</span>
                  </p>
                </div>
                <SettleFineForm fineId={fine.fineId} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="settled-heading"
        className="mt-[var(--space-2xl)] grid gap-[var(--space-sm)]"
      >
        <h2 id="settled-heading" className="text-lg">
          Recently settled
        </h2>
        {settled.length === 0 ? (
          <p className="text-muted">No settlements yet.</p>
        ) : (
          <ul className="ruled">
            {settled.map((fine) => (
              <li
                key={fine.fineId}
                className="grid gap-1 py-[var(--space-sm)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-[var(--space-lg)]"
              >
                <div>
                  <p className="font-medium text-ink">{fine.title}</p>
                  <p className="text-sm text-muted">
                    {fine.memberName} / <span className="figure">{fine.universityId}</span>
                    {fine.waiverReason ? ` / Waived: ${fine.waiverReason}` : null}
                  </p>
                </div>
                <p className="text-sm text-ink-2 sm:text-right">
                  <span className="figure">{formatMoney(fine.amount)}</span> /{" "}
                  {fine.status === "PAID" ? "Paid" : "Waived"}
                  {fine.settledAt ? (
                    <>
                      {" "}
                      <span className="figure">{formatDate(fine.settledAt)}</span>
                    </>
                  ) : null}
                  {fine.settledByName ? ` by ${fine.settledByName}` : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
