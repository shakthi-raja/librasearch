import { notFound, redirect } from "next/navigation";

/**
 * Due-date and overdue notices link here (the address is written by
 * sp_send_due_notices). Loans live on the member's own page, so this opens
 * it with that loan picked out. A returned loan just opens the page.
 */
export default async function LoanLinkPage({ params }: PageProps<"/student/loans/[loanId]">) {
  const { loanId } = await params;
  if (!/^\d{1,10}$/.test(loanId)) notFound();
  redirect(`/student?loan=${loanId}#loan-${loanId}`);
}
