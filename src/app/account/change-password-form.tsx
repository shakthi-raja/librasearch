"use client";

import { useActionState, useEffect, useRef } from "react";
import { type ChangePasswordState, changePasswordAction } from "./actions";

const FIELDS = [
  { name: "current", label: "Current password", autoComplete: "current-password" },
  { name: "next", label: "New password", autoComplete: "new-password" },
  { name: "confirm", label: "New password again", autoComplete: "new-password" },
] as const;

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(
    changePasswordAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.done) formRef.current?.reset();
    const first = FIELDS.find((f) => state.fieldErrors?.[f.name]);
    if (first) formRef.current?.querySelector<HTMLInputElement>(`#${first.name}`)?.focus();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="grid max-w-[24rem] gap-[var(--space-xs)]"
    >
      {state.done ? (
        <p role="status" className="chip chip-in-date mb-[var(--space-sm)] justify-self-start">
          Password changed. Other devices have been signed out.
        </p>
      ) : null}
      {FIELDS.map((field) => {
        const error = state.fieldErrors?.[field.name];
        return (
          <div key={field.name}>
            <div className="field">
              <label htmlFor={field.name}>{field.label}</label>
              <input
                id={field.name}
                name={field.name}
                type="password"
                autoComplete={field.autoComplete}
                aria-invalid={error ? true : undefined}
                aria-describedby={`${field.name}-message`}
                required
              />
            </div>
            <p id={`${field.name}-message`} className="field-message">
              {error}
            </p>
          </div>
        );
      })}
      <p className="mb-[var(--space-sm)] text-sm text-muted">
        At least 10 characters, with letters and numbers.
      </p>
      <button
        type="submit"
        className="btn btn-primary btn-lg justify-self-start"
        disabled={pending}
      >
        {pending ? "Saving" : "Change password"}
      </button>
    </form>
  );
}
