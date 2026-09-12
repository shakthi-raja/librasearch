import type { Metadata } from "next";
import Link from "next/link";
import { HoldCancelButton } from "@/components/holds/cancel-button";
import { PageHeader } from "@/components/layout/app-shell";
import { RenewButton } from "@/components/student/renew-button";
import { formatDate, formatDateTime, formatMoney, formatOrdinal, formatPeriod } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { getMemberHolds } from "@/server/services/holds";
import { getMemberDashboard } from "@/server/services/member";

export const metadata: Metadata = { title: "Your loans" };

const DAY = 86_400_000;

export default async function StudentHomePage() {
  const user = await requireUser("STUDENT", "FACULTY");
  const [{ overview, loans }, holds] = await Promise.all([
    getMemberDashboard(user.userId, user.role),
    getMemberHolds(user.userId, user.role),
  ]);
  const now = Date.now();
  const daysUntil = (date: Date) => Math.ceil((date.getTime() - now) / DAY);

  const dueSoon = loans.filter(
    (loan) => loan.daysOverdue === 0 && daysUntil(loan.dueAt) <= 3,
  ).length;
  const dueText =
    loans.length === 0
      ? "Nothing borrowed yet."
      : dueSoon === 0
        ? "Nothing is due in the next three days."
        : dueSoon === 1
          ? "One is due in the next three days."
          : `${dueSoon} are due in the next three days.`;
  const fineText =
    Number(overview.unpaidFines) > 0 ? ` ${formatMoney(overview.unpaidFines)} is unpaid.` : "";

  const ready = holds.filter((hold) => hold.status === "READY").length;
  const holdsText =
    holds.length === 0
      ? ""
      : ready > 0
        ? ` ${ready === 1 ? "One hold is ready to collect." : `${ready} holds are ready to collect.`}`
        : holds.length === 1
          ? " One hold in the queue."
          : ` ${holds.length} holds in the queue.`;

  return (
    <>
      <PageHeader
        title="Your loans"
        description={`${overview.activeLoans} of ${overview.maxLoans} loans. ${dueText}${fineText}${holdsText}`}
      />

      <section aria-label="Borrowed copies" className="max-w-[54rem]">
        {loans.length === 0 ? (
          <div className="ruled grid gap-2 py-[var(--space-lg)]">
            <h2 className="text-lg">Nothing borrowed</h2>
            <p className="max-w-[58ch] text-muted">
              Books you borrow at the issue desk appear here with the due date and the renewals
              left.
            </p>
            <Link href="/catalog" className="btn btn-primary w-fit">
              Browse the catalogue
            </Link>
          </div>
        ) : (
          <ul className="ruled">
            {loans.map((loan) => {
              const late = loan.daysOverdue > 0;
              const days = daysUntil(loan.dueAt);
              const renewLeft = loan.renewCount < overview.maxRenewals;
              const reason = late
                ? "Overdue loans cannot be renewed."
                : renewLeft
                  ? null
                  : "No renewals left.";

              return (
                <li key={loan.loanId} className="grid gap-[var(--space-sm)] py-[var(--space-lg)]">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-[var(--space-md)] gap-y-1">
                    <h2 className="text-lg">{loan.title}</h2>
                    <p className="figure text-sm text-ink-2">{loan.barcode}</p>
                  </div>
                  <p className="text-sm text-muted">
                    {loan.authors} / Edition {loan.editionNo} / {loan.rack}, shelf {loan.shelf}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-[var(--space-md)] gap-y-2">
                    <p className="text-sm">
                      Due <span className="figure">{formatDateTime(loan.dueAt)}</span>
                    </p>
                    <span
                      className={
                        late
                          ? "chip chip-error"
                          : days <= 3
                            ? "chip chip-signal"
                            : "chip chip-in-date"
                      }
                    >
                      {late
                        ? `${loan.daysOverdue} ${loan.daysOverdue === 1 ? "day" : "days"} late`
                        : days <= 0
                          ? "Due today"
                          : days === 1
                            ? "Due tomorrow"
                            : days <= 3
                              ? `Due in ${days} days`
                              : "On time"}
                    </span>
                    <p className="text-sm text-muted">
                      {formatPeriod(loan.periodRule)} / {loan.renewCount} of {overview.maxRenewals}{" "}
                      renewals
                    </p>
                  </div>

                  <RenewButton loanId={loan.loanId} disabled={reason !== null} reason={reason} />

                  {Number(loan.fineDue) > 0 ? (
                    <p className="text-sm text-error">Fine {formatMoney(loan.fineDue)} unpaid</p>
                  ) : null}
                  <p className="text-sm text-muted">
                    Borrowed <span className="figure">{formatDate(loan.issuedAt)}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        id="holds"
        aria-labelledby="holds-heading"
        className="mt-[var(--space-2xl)] grid max-w-[54rem] gap-[var(--space-sm)]"
      >
        <h2 id="holds-heading" className="text-lg">
          Your holds
        </h2>
        {holds.length === 0 ? (
          <p className="max-w-[58ch] text-muted">
            No holds. When every copy of a book is out, the book page offers a hold.
          </p>
        ) : (
          <ul className="ruled">
            {holds.map((hold) => (
              <li key={hold.holdId} className="grid gap-[var(--space-sm)] py-[var(--space-lg)]">
                <div className="flex flex-wrap items-baseline justify-between gap-x-[var(--space-md)] gap-y-1">
                  <h3 className="text-lg">{hold.title}</h3>
                  <span className={hold.status === "READY" ? "chip chip-signal" : "chip"}>
                    {hold.status === "READY"
                      ? "Ready to collect"
                      : `${formatOrdinal(hold.queuePosition)} in line`}
                  </span>
                </div>
                <p className="text-sm text-muted">{hold.authors}</p>
                {hold.status === "READY" ? (
                  <p className="text-sm">
                    Collect from <span className="figure">{hold.readyRack}</span> by{" "}
                    <span className="figure">
                      {hold.pickupBy ? formatDateTime(hold.pickupBy) : "the desk"}
                    </span>
                    {hold.readyBarcode ? (
                      <>
                        {" "}
                        / <span className="figure">{hold.readyBarcode}</span>
                      </>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-sm text-muted">
                    Placed <span className="figure">{formatDate(hold.placedAt)}</span>. The next
                    free copy is reserved for you when it returns.
                  </p>
                )}
                <HoldCancelButton holdId={hold.holdId} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
