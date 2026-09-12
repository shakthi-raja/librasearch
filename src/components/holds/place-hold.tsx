"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type HoldState, placeHoldAction } from "@/server/actions/holds";

export function PlaceHoldForm({ bookId }: { bookId: number }) {
  const [state, action, pending] = useActionState<HoldState, FormData>(placeHoldAction, {});

  if (state.ok) {
    return (
      <p role="status" className="text-sm text-ink-2">
        {state.ok}{" "}
        <Link href="/student" className="underline underline-offset-2">
          See your holds
        </Link>
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-[var(--space-sm)]">
      <input type="hidden" name="bookId" value={bookId} />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Placing hold" : "Place hold"}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-error">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
