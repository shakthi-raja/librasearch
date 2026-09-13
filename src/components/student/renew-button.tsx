"use client";

import { useActionState } from "react";
import { type RenewState, renewLoanAction } from "@/app/student/actions";
import { formatDateTime } from "@/lib/format";

type Props = { loanId: number; disabled: boolean; reason: string | null };

export function RenewButton({ loanId, disabled, reason }: Props) {
  const [state, action, pending] = useActionState<RenewState, FormData>(renewLoanAction, {});

  return (
    <form action={action} className="flex flex-wrap items-center gap-[var(--space-sm)]">
      <input type="hidden" name="loanId" value={loanId} />
      <button
        type="submit"
        className="btn"
        disabled={pending || disabled}
        title={reason ?? undefined}
      >
        {pending ? "Renewing" : "Renew"}
      </button>
      {reason ? <span className="text-sm text-muted">{reason}</span> : null}
      {state.error ? (
        <span role="alert" className="text-sm text-error">
          {state.error}
        </span>
      ) : null}
      {state.dueAt ? (
        <span className="text-sm text-ink-2">
          Renewed to <span className="figure">{formatDateTime(state.dueAt)}</span>
        </span>
      ) : null}
    </form>
  );
}
