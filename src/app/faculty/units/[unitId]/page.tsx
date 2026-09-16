import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth/current";
import { facultyUnit } from "@/server/services/faculty";

export const metadata: Metadata = { title: "Unit" };

export default async function UnitPage({ params }: PageProps<"/faculty/units/[unitId]">) {
  const user = await requireUser("FACULTY");
  const unitId = Number((await params).unitId);
  if (!Number.isInteger(unitId) || unitId <= 0) notFound();

  const unit = await facultyUnit(unitId, user.userId);

  return (
    <>
      <PageHeader
        title={`${unit.courseCode} unit ${unit.unitNo}`}
        description={`${unit.courseTitle}, ${unit.termName}, section ${unit.section}.`}
      />
      <section className="grid max-w-[62rem] gap-[var(--space-sm)]">
        <h2 className="text-lg">{unit.title}</h2>
        <p className="text-ink-2">{unit.topics}</p>
        <p className="text-sm text-muted">
          {unit.hours} contact hours / {unit.suggestions} suggested / {unit.approved} approved
        </p>
      </section>
    </>
  );
}
