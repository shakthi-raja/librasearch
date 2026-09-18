import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { facultyUnit, unitMappings } from "@/server/services/faculty";
import { reviewAction } from "./actions";

export const metadata: Metadata = { title: "Unit" };

const CHIP = {
  SUGGESTED: "chip chip-signal",
  APPROVED: "chip chip-in-date",
  REJECTED: "chip",
} as const;

export default async function UnitPage({ params }: PageProps<"/faculty/units/[unitId]">) {
  const user = await requireUser("FACULTY");
  const unitId = Number((await params).unitId);
  if (!Number.isInteger(unitId) || unitId <= 0) notFound();

  const unit = await facultyUnit(unitId, user.userId);
  const mappings = await unitMappings(unitId, user.userId);
  const approved = mappings.filter((mapping) => mapping.status === "APPROVED");

  return (
    <>
      <PageHeader
        title={`${unit.courseCode} unit ${unit.unitNo}`}
        description={`${unit.courseTitle}, ${unit.termName}, section ${unit.section}. ${unit.hours} contact hours.`}
      />
      <div className="grid max-w-[64rem] gap-[var(--space-2xl)]">
        <section aria-labelledby="unit-heading" className="grid gap-1">
          <h2 id="unit-heading" className="text-lg">
            {unit.title}
          </h2>
          <p className="text-ink-2">{unit.topics}</p>
          <p className="text-sm text-muted">
            {unit.suggestions} suggested / {unit.approved} approved
          </p>
        </section>

        <section aria-labelledby="suggestions-heading" className="grid gap-[var(--space-sm)]">
          <h2 id="suggestions-heading" className="text-lg">
            Suggested chapters
          </h2>
          {mappings.length === 0 ? (
            <p className="text-muted">
              No suggestions yet. Use “Suggest chapters” on the units page.
            </p>
          ) : (
            <ul className="ruled">
              {mappings.map((mapping) => (
                <li
                  key={mapping.chapterId}
                  className="grid gap-[var(--space-xs)] py-[var(--space-md)]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-sm)]">
                    <p>
                      <Link
                        href={`/catalog/${mapping.bookId}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {mapping.bookTitle}
                      </Link>
                      , chapter {mapping.chapterNo}: {mapping.chapterTitle}
                    </p>
                    <span className={CHIP[mapping.status]}>{mapping.status.toLowerCase()}</span>
                  </div>
                  <p className="text-sm text-muted">
                    {mapping.authors} / {mapping.source.toLowerCase()} /{" "}
                    <span className="figure">{mapping.similarity.toFixed(2)}</span>
                  </p>
                  <form action={reviewAction} className="flex flex-wrap gap-[var(--space-sm)]">
                    <input type="hidden" name="unitId" value={unitId} />
                    <input type="hidden" name="chapterId" value={mapping.chapterId} />
                    <button
                      type="submit"
                      name="status"
                      value="APPROVED"
                      className="btn"
                      disabled={mapping.status === "APPROVED"}
                    >
                      Approve
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="REJECTED"
                      className="btn btn-quiet"
                      disabled={mapping.status === "REJECTED"}
                    >
                      Reject
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="reading-list-heading" className="grid gap-[var(--space-sm)]">
          <h2 id="reading-list-heading" className="text-lg">
            Reading list
          </h2>
          {approved.length === 0 ? (
            <p className="text-muted">Approve a suggestion and the reading list appears here.</p>
          ) : (
            <ol className="ruled">
              {approved.map((mapping) => (
                <li key={mapping.chapterId} className="py-[var(--space-sm)]">
                  <p className="font-medium">{mapping.bookTitle}</p>
                  <p className="text-sm text-muted">
                    Chapter {mapping.chapterNo}: {mapping.chapterTitle} / {mapping.authors}
                  </p>
                </li>
              ))}
            </ol>
          )}
          <p className="text-sm text-muted">
            Reviewed chapters are dated in the audit trail. Last reviewed:{" "}
            {approved.length > 0 ? formatDate(new Date()) : "not yet"}.
          </p>
        </section>
      </div>
    </>
  );
}
