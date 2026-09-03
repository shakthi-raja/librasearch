import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: "Overview" };

export default function FacultyHomePage() {
  return (
    <>
      <PageHeader
        title="Your courses"
        description="Syllabus units for the offerings you coordinate, and the chapters that cover them."
      />
      <EmptyState title="No offerings yet">
        Offerings you coordinate this term show here once the library adds them.
      </EmptyState>
    </>
  );
}
