"use client";

import { useActionState, useEffect, useRef } from "react";
import { type SignInState, signInAction } from "./actions";

export function SignInForm({ next }: { next: string | undefined }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, {});
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // after a failed submit, focus goes to the first field that needs attention
  useEffect(() => {
    if (state.fieldErrors?.identifier || state.error) identifierRef.current?.focus();
    else if (state.fieldErrors?.password) passwordRef.current?.focus();
  }, [state]);

  const identifierError = state.fieldErrors?.identifier;
  const passwordError = state.fieldErrors?.password;

  return (
    <form action={action} noValidate className="grid gap-[var(--space-xs)]">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? (
        <p role="alert" className="alert mb-[var(--space-sm)]">
          {state.error}
        </p>
      ) : null}

      <div>
        <div className="field">
          <label htmlFor="identifier">University ID or email</label>
          <input
            ref={identifierRef}
            id="identifier"
            name="identifier"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={state.identifier}
            aria-invalid={identifierError ? true : undefined}
            aria-describedby={identifierError ? "identifier-error" : undefined}
            required
          />
        </div>
        <p id="identifier-error" className="field-message">
          {identifierError}
        </p>
      </div>

      <div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={passwordError ? "password-error" : undefined}
            required
          />
        </div>
        <p id="password-error" className="field-message">
          {passwordError}
        </p>
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
