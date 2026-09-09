"use client";

import { type ReactNode, useActionState } from "react";

export type FormState = { ok?: string; error?: string; fieldErrors?: Record<string, string> };

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel?: string;
  children: ReactNode;
  className?: string;
  quiet?: boolean;
};

/** A server-action form with inline status: the message sits beside the button that caused it. */
export function ActionForm({
  action,
  submitLabel,
  pendingLabel,
  children,
  className,
  quiet,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const fieldErrors = Object.entries(state.fieldErrors ?? {});
  return (
    <form action={formAction} className={className ?? "grid gap-[var(--space-sm)]"}>
      {children}
      <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
        <button type="submit" className={quiet ? "btn" : "btn btn-primary"} disabled={pending}>
          {pending ? (pendingLabel ?? "Saving") : submitLabel}
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {state.error ? <span className="text-error">{state.error}</span> : null}
          {state.ok ? <span className="text-ink-2">{state.ok}</span> : null}
        </p>
      </div>
      {fieldErrors.length > 0 ? (
        <ul className="text-sm text-error">
          {fieldErrors.map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as a child and nested in the label
    <label className="grid gap-1 text-xs font-medium text-muted">
      {label}
      {children}
    </label>
  );
}
