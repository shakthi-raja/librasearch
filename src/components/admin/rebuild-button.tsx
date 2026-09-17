"use client";

import { useActionState } from "react";
import { type RebuildState, rebuildAction } from "@/app/admin/vector/actions";

export function RebuildButton() {
  const [state, action, pending] = useActionState<RebuildState, FormData>(rebuildAction, {});
  return (
    <form action={action} className="grid gap-1">
      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Rebuilding" : "Rebuild collections"}
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
