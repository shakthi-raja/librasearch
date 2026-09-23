import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { shortagePlanner } from "@/server/services/demand";

export const metadata: Metadata = { title: "Demand" };

export default async function DemandPage() {
  await requireUser("LIBRARIAN");
  const rows = await shortagePlanner();
  const short = rows.filter((row) => row.shortage > 0);

  return (
    <>
      <PageHeader
        title="Demand"
        description="Enrolled students against the copies their reading lists can lend, ordered by the next exam."
      />

      <div className="mb-[var(--space-lg)] flex flex-wrap gap-[var(--space-md)] text-sm">
        <span className="chip">{rows.length} offerings</span>
        <span className={short.length > 0 ? "chip chip-error" : "chip chip-in-date"}>
          {short.length} short
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted">No planned or running offering has an enrolment yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <caption className="sr-only">
              Shortage by offering: enrolled students, next exam, assigned books and usable copies
            </caption>
            <thead>
              <tr>
                <th scope="col">Offering</th>
                <th scope="col">Enrolled</th>
                <th scope="col">Next exam</th>
                <th scope="col">Books</th>
                <th scope="col">Usable copies</th>
                <th scope="col">Short</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.offeringId}>
                  <td>
                    <p className="font-medium">
                      {row.courseCode} {row.courseTitle}
                    </p>
                    <p className="text-muted">
                      {row.termName} / section {row.section}
                    </p>
                  </td>
                  <td className="figure">{row.enrolled}</td>
                  <td>{row.nextExam ? formatDate(new Date(row.nextExam)) : "None scheduled"}</td>
                  <td className="figure">
                    {row.assignedBooks === 0 ? (
                      <span className="text-muted" title="No approved syllabus mapping yet">
                        Not mapped
                      </span>
                    ) : (
                      row.assignedBooks
                    )}
                  </td>
                  <td className="figure">{row.usable}</td>
                  <td>
                    <span className={row.shortage > 0 ? "chip chip-error" : "chip chip-in-date"}>
                      {row.shortage > 0 ? `${row.shortage} short` : "Covered"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
