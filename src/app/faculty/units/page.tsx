import type { Metadata } from "next";
import Link from "next/link";
import { SuggestButton } from "@/components/faculty/suggest-button";
import { PageHeader } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth/current";
import { facultyUnits } from "@/server/services/faculty";

export const metadata: Metadata = { title: "Your units" };

export default async function FacultyUnitsPage() {
  const user = await requireUser("FACULTY");
  const units = await facultyUnits(user.userId);

  return (
    <>
      <PageHeader
        title="Your units"
        description="Each unit of your offerings, with the chapters the library suggests for it."
      />

      {units.length === 0 ? (
        <p className="max-w-[54rem] text-muted">
          You coordinate no offering in the current terms. Ask the librarian to assign one.
        </p>
      ) : (
        <ul className="ruled max-w-[62rem]">
          {units.map((unit) => (
            <li key={unit.unitId} className="grid gap-[var(--space-sm)] py-[var(--space-lg)]">
              <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-sm)]">
                <h2 className="text-lg">
                  <Link
                    href={`/faculty/units/${unit.unitId}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {unit.courseCode} {unit.courseTitle}
                  </Link>
                </h2>
                <p className="text-sm text-muted">
                  {unit.termName} / section {unit.section}
                </p>
              </div>
              <p className="text-sm">
                Unit {unit.unitNo}: {unit.title}
              </p>
              <p className="max-w-[60ch] text-sm text-muted">{unit.topics}</p>
              <div className="flex flex-wrap items-center gap-x-[var(--space-md)] gap-y-2 text-sm">
                <span className="chip">{unit.suggestions} suggested</span>
                <span className="chip chip-in-date">{unit.approved} approved</span>
                <span className="text-muted">{unit.hours} contact hours</span>
              </div>
              <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
                <SuggestButton unitId={unit.unitId} />
                <Link href={`/faculty/units/${unit.unitId}`} className="btn">
                  Review
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
