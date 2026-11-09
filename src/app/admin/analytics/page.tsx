import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDate, formatMoney } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { libraryAnalytics } from "@/server/services/analytics";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requireUser("LIBRARIAN");
  const stats = await libraryAnalytics();
  const busiest = Math.max(1, ...stats.daily.map((day) => day.loans));
  const categoryTop = Math.max(1, ...stats.byCategory.map((row) => row.loans));

  const figures = [
    { label: "Loans, 30 days", value: String(stats.loans30) },
    { label: "On loan now", value: String(stats.active) },
    { label: "Overdue", value: String(stats.overdue), alarm: stats.overdue > 0 },
    { label: "Holds waiting", value: String(stats.holdsWaiting) },
    {
      label: "Unpaid fines",
      value: formatMoney(stats.unpaid.amount),
      note: stats.unpaid.count > 0 ? `${stats.unpaid.count} open` : undefined,
    },
    { label: "Active members", value: String(stats.members) },
  ];

  return (
    <>
      <PageHeader
        title="Analytics"
        description="How the collection is used: desk traffic, demand and money still owed."
      />

      <dl className="mb-[var(--space-xl)] grid grid-cols-2 gap-[var(--space-sm)] md:grid-cols-3 lg:grid-cols-6">
        {figures.map((figure) => (
          <div
            key={figure.label}
            className="rounded-[var(--radius-card)] border border-rule bg-paper-2 p-[var(--space-md)]"
          >
            <dt className="text-xs text-muted">{figure.label}</dt>
            <dd className={`figure mt-1 text-2xl ${figure.alarm ? "text-error" : "text-ink"}`}>
              {figure.value}
              {figure.note ? (
                <span className="ml-1 align-baseline text-xs font-normal text-muted">
                  {figure.note}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-[var(--space-xl)] lg:grid-cols-2">
        <section aria-labelledby="daily-heading">
          <h2 id="daily-heading" className="mb-[var(--space-xs)] text-lg">
            Desk traffic
          </h2>
          <p className="text-muted mb-[var(--space-sm)] text-sm">Loans issued, last 14 days.</p>
          <ol className="flex h-40 items-end gap-1 border-b border-rule pb-1">
            {stats.daily.map((day) => (
              <li
                key={day.day}
                className="flex h-full flex-1 flex-col justify-end"
                aria-label={`${formatDate(new Date(day.day))}: ${day.loans} loans`}
              >
                <div
                  className="w-full rounded-t-[2px] bg-accent"
                  style={{ height: `${Math.max(4, (day.loans / busiest) * 100)}%` }}
                  aria-hidden="true"
                />
              </li>
            ))}
          </ol>
          <div className="flex justify-between text-xs text-muted">
            <span>{formatDate(new Date(stats.daily[0]?.day ?? Date.now()))}</span>
            <span>{formatDate(new Date(stats.daily.at(-1)?.day ?? Date.now()))}</span>
          </div>
        </section>

        <section aria-labelledby="category-heading">
          <h2 id="category-heading" className="mb-[var(--space-xs)] text-lg">
            Busiest subjects
          </h2>
          <p className="text-muted mb-[var(--space-sm)] text-sm">
            Loans by shelf subject, 30 days.
          </p>
          {stats.byCategory.length === 0 ? (
            <p className="text-muted">No loan has been recorded yet.</p>
          ) : (
            <ul className="grid gap-[var(--space-sm)]">
              {stats.byCategory.map((row) => (
                <li key={row.name}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span>{row.name}</span>
                    <span className="figure text-muted">{row.loans}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-pill bg-paper-3" aria-hidden="true">
                    <div
                      className="h-2 rounded-pill bg-accent"
                      style={{ width: `${(row.loans / categoryTop) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="top-heading" className="mt-[var(--space-xl)]">
        <h2 id="top-heading" className="mb-[var(--space-sm)] text-lg">
          Most borrowed
        </h2>
        {stats.topBooks.length === 0 ? (
          <p className="text-muted">No loans in the last 30 days.</p>
        ) : (
          <table className="table">
            <caption className="sr-only">Books with the most loans in the last 30 days</caption>
            <thead>
              <tr>
                <th scope="col">Book</th>
                <th scope="col">Loans</th>
              </tr>
            </thead>
            <tbody>
              {stats.topBooks.map((book) => (
                <tr key={book.bookId}>
                  <td>
                    <p className="font-medium">{book.title}</p>
                    <p className="text-muted text-sm">{book.authors || "Unknown author"}</p>
                  </td>
                  <td className="figure">{book.loans}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
