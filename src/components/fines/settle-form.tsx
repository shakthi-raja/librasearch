"use client";

import { useActionState } from "react";
import { type FineState, settleFineAction } from "@/server/actions/fines";

export function SettleFineForm({ fineId }: { fineId: number }) {
  const [state, action, pending] = useActionState<FineState, FormData>(settleFineAction, {});

  return (
    <form action={action} className="grid w-full gap-[var(--space-sm)] lg:max-w-[22rem]">
      <input type="hidden" name="fineId" value={fineId} />
      <button
        type="submit"
        name="action"
        value="PAID"
        className="btn btn-primary w-fit"
        disabled={pending}
      >
        {pending ? "Recording" : "Record payment"}
      </button>
      <div className="flex flex-wrap items-end gap-[var(--space-sm)]">
        <label className="grid min-w-[12rem] flex-1 gap-1 text-xs font-medium text-muted">
          Waiver reason
          <input name="reason" minLength={5} maxLength={300} className="input" />
        </label>
        <button type="submit" name="action" value="WAIVED" className="btn" disabled={pending}>
          Waive
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
