import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: "Overview" };

export default function StudentHomePage() {
  return (
    <>
      <PageHeader title="Your desk" description="Loans, holds and fines, with what is due first." />
      <EmptyState title="Nothing borrowed">
        Books you borrow at the issue desk show here with their due dates and renewals left.
      </EmptyState>
    </>
  );
}
