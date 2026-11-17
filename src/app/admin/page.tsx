import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { deskOverview } from "@/server/services/desk-overview";

export const metadata: Metadata = { title: "Overview" };

const DAY = 86_400_000;

export default async function LibrarianHomePage() {
  await requireUser("LIBRARIAN");
  const desk = await deskOverview();
  const now = Date.now();

  const figures = [
    { label: "Issued today", value: String(desk.issuedToday), href: "/admin/circulation" },
    { label: "Returned today", value: String(desk.returnedToday), href: "/admin/circulation" },
    { label: "On loan now", value: String(desk.active), href: "/admin/analytics" },
    {
      label: "Overdue",
      value: String(desk.overdue),
      href: "/admin/fines",
      alarm: desk.overdue > 0,
    },
    {
      label: "Ready to collect",
      value: String(desk.holdsReady),
      href: "/admin/holds",
      note: desk.holdsWaiting > 0 ? `${desk.holdsWaiting} waiting` : undefined,
    },
    {
      label: "Unpaid fines",
      value: formatMoney(desk.unpaid.amount),
      href: "/admin/fines",
      note: desk.unpaid.count > 0 ? `${desk.unpaid.count} open` : undefined,
    },
  ] as const;

  return (
    <>
      <PageHeader
        title="Library overview"
        description="The desk, the stacks and the queue, in one place."
      />

      <ul
        aria-label="Today at the desk"
        className="mb-[var(--space-xl)] grid grid-cols-2 gap-[var(--space-sm)] md:grid-cols-3 lg:grid-cols-6"
      >
        {figures.map((figure) => (
          <li key={figure.label}>
            <Link
              href={figure.href}
              className="block h-full rounded-[var(--radius-card)] border border-rule bg-paper-2 p-[var(--space-md)] no-underline hover:border-ink"
            >
              <span className="block text-xs text-muted">{figure.label}</span>
              <span
                className={`figure mt-1 block text-2xl ${"alarm" in figure && figure.alarm ? "text-error" : "text-ink"}`}
              >
                {figure.value}
                {"note" in figure && figure.note ? (
                  <span className="ml-1 align-baseline text-xs font-normal text-muted">
                    {figure.note}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mb-[var(--space-xl)] flex flex-wrap gap-[var(--space-sm)]">
        <Link href="/admin/circulation" className="btn btn-primary">
          Open the circulation desk
        </Link>
        <Link href="/admin/holds" className="btn">
          Holds
        </Link>
        <Link href="/admin/fines" className="btn">
          Fines
        </Link>
      </div>

      <div className="grid gap-[var(--space-xl)] lg:grid-cols-2">
        <section aria-labelledby="ready-heading">
          <h2 id="ready-heading" className="mb-[var(--space-xs)] text-lg">
            Waiting on the hold shelf
          </h2>
          <p className="mb-[var(--space-sm)] text-sm text-muted">
            Copies kept for a member; they go to the next in the queue when the pickup time passes.
          </p>
          {desk.readyHolds.length === 0 ? (
            <p className="text-muted">Nothing is waiting to be collected.</p>
          ) : (
            <ul className="ruled">
              {desk.readyHolds.map((hold) => (
                <li
                  key={hold.holdId}
                  className="flex flex-wrap items-baseline justify-between gap-x-[var(--space-md)] gap-y-1 py-[var(--space-sm)]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{hold.title}</p>
                    <p className="text-sm text-muted">
                      {hold.memberName} / <span className="figure">{hold.universityId}</span>
                      {hold.barcode ? (
                        <>
                          {" "}
                          / copy <span className="figure">{hold.barcode}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  {hold.pickupBy ? (
                    <p className="text-sm text-ink-2">
                      Collect by <span className="figure">{formatDateTime(hold.pickupBy)}</span>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="overdue-heading">
          <h2 id="overdue-heading" className="mb-[var(--space-xs)] text-lg">
            Most overdue
          </h2>
          <p className="mb-[var(--space-sm)] text-sm text-muted">
            Fines grow by the day until the copy comes back.
          </p>
          {desk.overdueLoans.length === 0 ? (
            <p className="text-muted">Every loan is on time.</p>
          ) : (
            <ul className="ruled">
              {desk.overdueLoans.map((loan) => {
                const days = Math.max(1, Math.floor((now - loan.dueAt.getTime()) / DAY));
                return (
                  <li
                    key={loan.loanId}
                    className="flex flex-wrap items-baseline justify-between gap-x-[var(--space-md)] gap-y-1 py-[var(--space-sm)]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{loan.title}</p>
                      <p className="text-sm text-muted">
                        {loan.memberName} / <span className="figure">{loan.universityId}</span> /
                        copy <span className="figure">{loan.barcode}</span>
                      </p>
                    </div>
                    <p className="text-sm text-error">
                      {days} {days === 1 ? "day" : "days"} late, due{" "}
                      <span className="figure">{formatDate(loan.dueAt)}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
