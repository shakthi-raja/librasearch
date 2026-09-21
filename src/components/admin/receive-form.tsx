"use client";

import { useActionState } from "react";
import { type FormState, receiveAction } from "@/app/admin/procurement/actions";

export function ReceiveForm({ requestId, quantity }: { requestId: number; quantity: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(receiveAction, {});
  const fieldErrors = Object.entries(state.fieldErrors ?? {});

  return (
    <form action={action} className="grid min-w-56 gap-1">
      <input type="hidden" name="requestId" value={requestId} />
      <input
        name="vendor"
        required
        maxLength={120}
        className="input"
        placeholder="Vendor"
        aria-label={`Vendor for request ${requestId}`}
      />
      <div className="flex gap-1">
        <input name="rack" required defaultValue="CS-04" className="input w-20" aria-label="Rack" />
        <input name="shelf" required defaultValue="S1" className="input w-14" aria-label="Shelf" />
        <input
          name="count"
          type="number"
          min={1}
          max={50}
          defaultValue={quantity}
          className="input w-16"
          aria-label="Copies received"
        />
      </div>
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Receiving" : "Receive"}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-error">
          {state.error}
        </p>
      ) : null}
      {fieldErrors.length > 0 ? (
        <ul className="text-sm text-error">
          {fieldErrors.map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-ink-2">
          {state.ok}
        </p>
      ) : null}
    </form>
  );
}
