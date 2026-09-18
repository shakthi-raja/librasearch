import type { Metadata } from "next";
import { ExamPolicyForm } from "@/components/admin/exam-policy-form";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { examWindows } from "@/server/services/exam-policy";

export const metadata: Metadata = { title: "Exams" };

const EXAM_LABEL: Record<string, string> = {
  QUIZ: "Quiz",
  MID_SEM: "Mid semester",
  END_SEM: "End semester",
};

const POLICY_LABEL: Record<string, string> = {
  SHORT_LOAN: "Short loan",
  REFERENCE_ONLY: "Reference only",
};

export default async function ExamsPage() {
  await requireUser("LIBRARIAN");
  const windows = await examWindows();
  const withPolicy = windows.filter((window) => window.active > 0);

  return (
    <>
      <PageHeader
        title="Exams"
        description="Shorten the loan of the copies a course depends on while its exam window is open."
      />

      <div className="mb-[var(--space-md)] flex flex-wrap gap-[var(--space-md)] text-sm">
        <span className="chip">{windows.length} open windows</span>
        <span className={withPolicy.length > 0 ? "chip chip-signal" : "chip"}>
          {withPolicy.length} with a policy
        </span>
      </div>

      <p className="text-muted mb-[var(--space-lg)] max-w-[62ch] text-sm">
        A policy lifts by itself the morning after the window closes, and every copy goes back to
        the rule it had before. Only copies on the offering&rsquo;s approved reading list change;
        reference copies stay in the building.
      </p>

      {windows.length === 0 ? (
        <p className="text-muted">No exam window is open or coming up.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <caption className="sr-only">
              Open exam windows, their reading-list copies and any active lending policy
            </caption>
            <thead>
              <tr>
                <th scope="col">Exam</th>
                <th scope="col">Offering</th>
                <th scope="col">Reading list</th>
                <th scope="col">Policy</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {windows.map((window) => (
                <tr key={window.examId}>
                  <td>
                    <p className="font-medium">{EXAM_LABEL[window.examType] ?? window.examType}</p>
                    <p className="text-muted text-sm">
                      {formatDate(new Date(window.startsOn))} to{" "}
                      {formatDate(new Date(window.endsOn))}
                    </p>
                  </td>
                  <td>
                    <p className="font-medium">
                      {window.courseCode} {window.courseTitle}
                    </p>
                    <p className="text-muted text-sm">
                      {window.termName} / section {window.section}
                    </p>
                  </td>
                  <td className="figure">
                    {window.copies === 0 ? (
                      <span className="text-muted" title="No approved syllabus mapping yet">
                        Not mapped
                      </span>
                    ) : (
                      `${window.copies} ${window.copies === 1 ? "copy" : "copies"}`
                    )}
                  </td>
                  <td>
                    {window.appliedPolicy ? (
                      <span className="chip chip-signal">
                        {POLICY_LABEL[window.appliedPolicy] ?? window.appliedPolicy}
                      </span>
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </td>
                  <td>
                    <ExamPolicyForm examId={window.examId} active={window.active > 0} />
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
