import type { Metadata } from "next";
import { ActionForm, Field } from "@/components/forms/action-form";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { getAcademicStructure } from "@/server/services/academic";
import {
  createCourseAction,
  createOfferingAction,
  createTermAction,
  makeCurrentTermAction,
} from "./actions";

export const metadata: Metadata = { title: "Academic structure" };

export default async function AcademicPage() {
  await requireUser("LIBRARIAN");
  const { terms, courses, offerings, departments, faculty } = await getAcademicStructure();

  return (
    <>
      <PageHeader
        title="Academic structure"
        description="Terms, the course catalogue and the offerings that put a course in front of students."
      />

      <div className="grid gap-[var(--space-2xl)] xl:grid-cols-2">
        <section
          aria-labelledby="terms-heading"
          className="grid content-start gap-[var(--space-lg)]"
        >
          <h2 id="terms-heading" className="text-lg">
            Terms
          </h2>
          <ul className="ruled">
            {terms.map((term) => (
              <li key={term.termId} className="grid gap-1 py-[var(--space-md)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">{term.name}</p>
                  {term.isCurrent ? (
                    <span className="chip chip-signal">Current term</span>
                  ) : (
                    <form action={makeCurrentTermAction}>
                      <input type="hidden" name="termId" value={term.termId} />
                      <button type="submit" className="btn btn-quiet">
                        Make current
                      </button>
                    </form>
                  )}
                </div>
                <p className="figure text-sm text-muted">
                  {formatDate(term.startDate)} to {formatDate(term.endDate)}
                </p>
              </li>
            ))}
          </ul>

          <ActionForm action={createTermAction} submitLabel="Add term" pendingLabel="Adding">
            <div className="grid gap-[var(--space-sm)] sm:grid-cols-2">
              <Field label="Term name">
                <input name="name" required maxLength={40} className="input" />
              </Field>
              <div />
              <Field label="Starts">
                <input name="startDate" type="date" required className="input" />
              </Field>
              <Field label="Ends">
                <input name="endDate" type="date" required className="input" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" name="current" /> Make this the current term
            </label>
          </ActionForm>
        </section>

        <section
          aria-labelledby="courses-heading"
          className="grid content-start gap-[var(--space-lg)]"
        >
          <h2 id="courses-heading" className="text-lg">
            Courses
          </h2>
          <ul className="ruled">
            {courses.map((course) => (
              <li key={course.courseId} className="grid gap-1 py-[var(--space-md)]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-ink">{course.title}</p>
                  <p className="figure text-sm text-ink-2">{course.code}</p>
                </div>
                <p className="text-sm text-muted">
                  {course.deptName} / semester {course.semester} / {course.credits} credits
                </p>
              </li>
            ))}
          </ul>

          <ActionForm action={createCourseAction} submitLabel="Add course" pendingLabel="Adding">
            <div className="grid gap-[var(--space-sm)] sm:grid-cols-2">
              <Field label="Course code">
                <input name="courseCode" required maxLength={12} className="input" />
              </Field>
              <Field label="Title">
                <input name="title" required maxLength={160} className="input" />
              </Field>
              <Field label="Department">
                <select name="deptId" required defaultValue="" className="select">
                  <option value="" disabled>
                    Choose a department
                  </option>
                  {departments.map((department) => (
                    <option key={department.deptId} value={department.deptId}>
                      {department.name} ({department.code})
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-[var(--space-sm)]">
                <Field label="Semester">
                  <input
                    name="semester"
                    type="number"
                    min={1}
                    max={8}
                    required
                    defaultValue={1}
                    className="input"
                  />
                </Field>
                <Field label="Credits">
                  <input
                    name="credits"
                    type="number"
                    min={1}
                    max={6}
                    required
                    defaultValue={3}
                    className="input"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea name="description" rows={3} maxLength={2000} className="input" />
                </Field>
              </div>
            </div>
          </ActionForm>
        </section>
      </div>

      <section
        aria-labelledby="offerings-heading"
        className="mt-[var(--space-2xl)] grid gap-[var(--space-lg)]"
      >
        <h2 id="offerings-heading" className="text-lg">
          Offerings
        </h2>
        <ul className="ruled">
          {offerings.map((offering) => (
            <li
              key={offering.offeringId}
              className="grid gap-1 py-[var(--space-md)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] lg:items-baseline lg:gap-[var(--space-lg)]"
            >
              <div>
                <p className="font-medium text-ink">
                  {offering.courseTitle}{" "}
                  <span className="figure text-sm text-ink-2">
                    {offering.courseCode} / {offering.section}
                  </span>
                </p>
                <p className="text-sm text-muted">{offering.termName}</p>
              </div>
              <p className="text-sm text-muted">
                {offering.coordinator ?? "No coordinator"} / {offering.students} enrolled
              </p>
              <span className="chip w-fit">{offering.status.toLowerCase()}</span>
            </li>
          ))}
        </ul>

        <ActionForm
          action={createOfferingAction}
          submitLabel="Add offering"
          pendingLabel="Adding"
          className="grid max-w-[42rem] gap-[var(--space-sm)]"
        >
          <div className="grid gap-[var(--space-sm)] sm:grid-cols-2">
            <Field label="Course">
              <select name="courseId" required defaultValue="" className="select">
                <option value="" disabled>
                  Choose a course
                </option>
                {courses.map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.code} {course.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Term">
              <select name="termId" required defaultValue="" className="select">
                <option value="" disabled>
                  Choose a term
                </option>
                {terms.map((term) => (
                  <option key={term.termId} value={term.termId}>
                    {term.name}
                    {term.isCurrent ? " (current)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Section">
              <input name="section" required maxLength={1} className="input" />
            </Field>
            <Field label="Coordinator">
              <select name="coordinatorId" defaultValue="" className="select">
                <option value="">None yet</option>
                {faculty.map((person) => (
                  <option key={person.userId} value={person.userId}>
                    {person.fullName}
                    {person.deptCode ? ` (${person.deptCode})` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select name="status" defaultValue="PLANNED" className="select">
                <option value="PLANNED">Planned</option>
                <option value="RUNNING">Running</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </Field>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
