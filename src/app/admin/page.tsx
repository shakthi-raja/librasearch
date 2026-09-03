import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: "Overview" };

export default function LibrarianHomePage() {
  return (
    <>
      <PageHeader
        title="Library overview"
        description="The desk, the stacks and the queue, in one place."
      />
      <EmptyState title="The desk is quiet">
        Loans, holds and overdue items appear here as soon as the first copy is issued.
      </EmptyState>
    </>
  );
}
