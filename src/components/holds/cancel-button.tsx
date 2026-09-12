"use client";

import { useActionState } from "react";
import { cancelHoldAction, type HoldState } from "@/server/actions/holds";

type Props = { holdId: number; label?: string };

export function HoldCancelButton({ holdId, label = "Cancel hold" }: Props) {
  const [state, action, pending] = useActionState<HoldState, FormData>(cancelHoldAction, {});

  return (
    <form action={action} className="flex flex-wrap items-center gap-[var(--space-sm)]">
      <input type="hidden" name="holdId" value={holdId} />
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Cancelling" : label}
      </button>
      {state.error ? (
        <span role="alert" className="text-sm text-error">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
