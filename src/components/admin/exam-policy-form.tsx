"use client";

import { useActionState } from "react";
import { applyAction, type PolicyState, revertAction } from "@/app/admin/exams/actions";

const initial: PolicyState = {};

export function ExamPolicyForm({ examId, active }: { examId: number; active: boolean }) {
  const [applyState, apply, applying] = useActionState<PolicyState, FormData>(applyAction, initial);
  const [revertState, revert, reverting] = useActionState<PolicyState, FormData>(
    revertAction,
    initial,
  );
  const error = active ? revertState.error : applyState.error;
  const ok = error ? undefined : active ? applyState.ok : revertState.ok;

  return (
    <div className="grid gap-1">
      {active ? (
        <form action={revert}>
          <input type="hidden" name="examId" value={examId} />
          <button type="submit" className="btn" disabled={reverting}>
            {reverting ? "Reverting" : "Revert policy"}
          </button>
        </form>
      ) : (
        <form action={apply} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="examId" value={examId} />
          <select name="policy" className="select" aria-label="Exam policy">
            <option value="SHORT_LOAN">Short loan</option>
            <option value="REFERENCE_ONLY">Reference only</option>
          </select>
          <button type="submit" className="btn btn-primary" disabled={applying}>
            {applying ? "Applying" : "Apply"}
          </button>
        </form>
      )}
      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p role="status" className="text-sm text-ink-2">
          {ok}
        </p>
      ) : null}
    </div>
  );
}
