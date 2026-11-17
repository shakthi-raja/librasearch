import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth/current";
import { type FacultyUnit, facultyUnits } from "@/server/services/faculty";

export const metadata: Metadata = { title: "Overview" };

export default async function FacultyHomePage() {
  const user = await requireUser("FACULTY");
  const units = await facultyUnits(user.userId);

  // one card per offering, units in order
  const offerings = new Map<string, { label: string; term: string; units: FacultyUnit[] }>();
  for (const unit of units) {
    const key = `${unit.courseCode}|${unit.termName}|${unit.section}`;
    const entry = offerings.get(key) ?? {
      label: `${unit.courseCode} ${unit.courseTitle}`,
      term: `${unit.termName} / section ${unit.section}`,
      units: [],
    };
    entry.units.push(unit);
    offerings.set(key, entry);
  }

  const covered = units.filter((unit) => unit.approved > 0).length;
  const toReview = units.reduce((sum, unit) => sum + unit.suggestions, 0);
  const figures = [
    { label: "Courses you coordinate", value: String(offerings.size) },
    { label: "Units", value: String(units.length) },
    { label: "Units with approved reading", value: `${covered} of ${units.length}` },
    { label: "Suggestions to review", value: String(toReview) },
  ];

  return (
    <>
      <PageHeader
        title="Your courses"
        description="Syllabus units for the offerings you coordinate, and the chapters that cover them."
      />

      {units.length === 0 ? (
        <EmptyState title="No offerings yet">
          Offerings you coordinate this term show here once the library adds them.
        </EmptyState>
      ) : (
        <>
          <ul
            aria-label="Your reading lists at a glance"
            className="mb-[var(--space-xl)] grid grid-cols-2 gap-[var(--space-sm)] lg:grid-cols-4"
          >
            {figures.map((figure) => (
              <li
                key={figure.label}
                className="rounded-[var(--radius-card)] border border-rule bg-paper-2 p-[var(--space-md)]"
              >
                <span className="block text-xs text-muted">{figure.label}</span>
                <span className="figure mt-1 block text-2xl text-ink">{figure.value}</span>
              </li>
            ))}
          </ul>

          <div className="grid gap-[var(--space-xl)]">
            {[...offerings.values()].map((offering) => (
              <section key={offering.label} aria-label={offering.label}>
                <h2 className="text-lg">{offering.label}</h2>
                <p className="mb-[var(--space-sm)] text-sm text-muted">{offering.term}</p>
                <ul className="ruled">
                  {offering.units.map((unit) => (
                    <li
                      key={unit.unitId}
                      className="flex flex-wrap items-baseline justify-between gap-x-[var(--space-md)] gap-y-1 py-[var(--space-sm)]"
                    >
                      <Link
                        href={`/faculty/units/${unit.unitId}`}
                        className="min-w-0 font-medium text-ink underline-offset-4 hover:underline"
                      >
                        Unit {unit.unitNo}: {unit.title}
                      </Link>
                      <p className="text-sm text-ink-2">
                        {unit.approved > 0 ? (
                          <span className="chip chip-in-date">{unit.approved} approved</span>
                        ) : (
                          <span className="chip">No reading yet</span>
                        )}
                        {unit.suggestions > 0 ? (
                          <span className="ml-2 text-muted">{unit.suggestions} to review</span>
                        ) : null}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-[var(--space-xl)] flex flex-wrap gap-[var(--space-sm)]">
            <Link href="/faculty/units" className="btn btn-primary">
              Review and suggest chapters
            </Link>
            <Link href="/faculty/coverage" className="btn">
              Coverage
            </Link>
          </div>
        </>
      )}
    </>
  );
}
