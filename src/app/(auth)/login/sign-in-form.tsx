"use client";

import { useActionState } from "react";
import { type SignInState, signInAction } from "./actions";

export function SignInForm({ next }: { next: string | undefined }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, {});

  return (
    <form action={action} noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? <p role="alert">{state.error}</p> : null}

      <label htmlFor="identifier">University ID or email</label>
      <input
        id="identifier"
        name="identifier"
        autoComplete="username"
        defaultValue={state.identifier}
        aria-invalid={state.fieldErrors?.identifier ? true : undefined}
        aria-describedby={state.fieldErrors?.identifier ? "identifier-error" : undefined}
        required
      />
      {state.fieldErrors?.identifier ? (
        <p id="identifier-error">{state.fieldErrors.identifier}</p>
      ) : null}

      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        aria-invalid={state.fieldErrors?.password ? true : undefined}
        aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
        required
      />
      {state.fieldErrors?.password ? <p id="password-error">{state.fieldErrors.password}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
