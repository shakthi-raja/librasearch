import type { Metadata } from "next";
import { DeskForm } from "@/components/circulation/desk-form";
import { PageHeader } from "@/components/layout/app-shell";
import type { DeskPolicy } from "@/lib/circulation/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { getDeskPolicy, getRecentActivity } from "@/server/services/circulation";

export const metadata: Metadata = { title: "Circulation desk" };

export default async function CirculationPage() {
  await requireUser("LIBRARIAN");
  const [policy, recent] = await Promise.all([getDeskPolicy(), getRecentActivity(8)]);

  return (
    <>
      <PageHeader
        title="Circulation desk"
        description="Issue and return by barcode. The database decides the due date, the fine and the next hold."
      />

      <div className="grid gap-[var(--space-2xl)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <DeskForm policy={policy} />
        <DeskRules policy={policy} />
      </div>

      <section aria-labelledby="recent-heading" className="mt-[var(--space-2xl)]">
        <h2 id="recent-heading" className="mb-[var(--space-sm)] text-lg">
          Recent at the desk
        </h2>
        {recent.length === 0 ? (
          <p className="text-muted">
            Nothing has crossed the desk yet. Issue the first copy above and it appears here.
          </p>
        ) : (
          <ul className="ruled">
            {recent.map((row) => (
              <li
                key={row.loanId}
                className="grid gap-1 py-[var(--space-sm)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-[var(--space-lg)]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{row.title}</p>
                  <p className="text-sm text-muted">
                    {row.memberName} / <span className="figure">{row.barcode}</span>
                  </p>
                </div>
                <p className="text-sm text-ink-2 sm:text-right">
                  {row.returnedAt ? "Returned" : "Issued"}{" "}
                  <span className="figure">{formatDateTime(row.returnedAt ?? row.issuedAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function DeskRules({ policy }: { policy: DeskPolicy }) {
  return (
    <section aria-labelledby="desk-rules-heading" className="grid gap-[var(--space-sm)]">
      <h2 id="desk-rules-heading" className="text-lg">
        Desk rules
      </h2>
      <dl className="ruled">
        <Rule label="Regular loan" value={`${policy.regularLoanDays} days`} />
        <Rule
          label="High demand"
          value={`${policy.busyLoanDays} days after ${policy.busyWaits} waiting`}
        />
        <Rule label="Short loan" value={`${policy.shortLoanDays} days`} />
        <Rule label="Fine" value={`${formatMoney(policy.finePerDay)} a day`} />
        <Rule label="Fine cap" value={formatMoney(policy.fineCap)} />
        <Rule label="Hold pickup" value={`${policy.holdExpiryHours} hours`} />
        <Rule label="Reference copy" value="Stays in the library" figure={false} />
      </dl>
    </section>
  );
}

function Rule({ label, value, figure = true }: { label: string; value: string; figure?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-[var(--space-md)] py-[var(--space-sm)]">
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className={`${figure ? "figure" : ""} text-right text-sm text-ink`}>{value}</dd>
    </div>
  );
}
