"use client";

import { useActionState } from "react";
import { suggestAction, type UnitState } from "@/app/faculty/units/actions";

export function SuggestButton({ unitId }: { unitId: number }) {
  const [state, action, pending] = useActionState<UnitState, FormData>(suggestAction, {});

  return (
    <form action={action} className="grid gap-1">
      <input type="hidden" name="unitId" value={unitId} />
      <button type="submit" className="btn w-fit" disabled={pending}>
        {pending ? "Reading the shelves" : "Suggest chapters"}
      </button>
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
