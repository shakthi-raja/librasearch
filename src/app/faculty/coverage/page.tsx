import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth/current";
import { facultyCoverage } from "@/server/services/faculty";

export const metadata: Metadata = { title: "Coverage" };

export default async function CoveragePage() {
  const user = await requireUser("FACULTY");
  const rows = await facultyCoverage(user.userId);

  return (
    <>
      <PageHeader
        title="Coverage"
        description="How much of each unit has at least one approved chapter."
      />
      {rows.length === 0 ? (
        <p className="text-muted">You coordinate no offering yet.</p>
      ) : (
        <ul className="ruled max-w-[54rem]">
          {rows.map((row) => {
            const percent = row.units === 0 ? 0 : Math.round((row.covered / row.units) * 100);
            return (
              <li
                key={`${row.courseCode}-${row.section}`}
                className="grid gap-2 py-[var(--space-md)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-sm)]">
                  <p className="font-medium">
                    {row.courseCode} {row.courseTitle}
                  </p>
                  <p className="figure text-sm">{percent}%</p>
                </div>
                <p className="text-sm text-muted">
                  {row.termName} / section {row.section} / {row.covered} of {row.units} units
                </p>
                <div
                  className="h-2 w-full bg-rule"
                  role="img"
                  aria-label={`${row.covered} of ${row.units} units covered`}
                >
                  <div className="h-2 bg-signal" style={{ width: `${percent}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
