"use client";

import { useActionState } from "react";
import { decideAction, type FormState } from "@/app/admin/procurement/actions";

export function DecisionForm({ requestId }: { requestId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(decideAction, {});

  return (
    <form action={action} className="grid min-w-48 gap-1">
      <input type="hidden" name="requestId" value={requestId} />
      <input
        name="note"
        maxLength={300}
        className="input"
        placeholder="Note (required to reject)"
        aria-label={`Decision note for request ${requestId}`}
      />
      <div className="flex gap-2">
        <button name="decision" value="APPROVED" type="submit" className="btn" disabled={pending}>
          Approve
        </button>
        <button name="decision" value="REJECTED" type="submit" className="btn" disabled={pending}>
          Reject
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-error">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-ink-2">
          {state.ok}
        </p>
      ) : null}
    </form>
  );
}
