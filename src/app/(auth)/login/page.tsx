import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/auth/google-button";
import { Wordmark } from "@/components/brand/wordmark";
import { StackMap } from "@/components/stack-map/stack-map";
import { currentUser, HOME_BY_ROLE } from "@/server/auth/current";
import { googleConfig } from "@/server/auth/google";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

const GOOGLE_ERRORS: Record<string, string> = {
  google_no_account:
    "That Google account's address is not on the library's records. Sign in with your university ID, then link Google from your account page.",
  google_inactive: "This account is not active. Please contact the library desk.",
  google_linked_elsewhere:
    "Your library account is linked to a different Google account. Use that one, or sign in with your university ID.",
  google_unverified: "Google has not verified that address, so it cannot be used to sign in.",
  google_throttled: "Too many attempts. Try again in a few minutes.",
  google_cancelled: "Google sign-in was cancelled.",
  google_unavailable: "Google sign-in is not set up for this library.",
  google_failed: "Google sign-in did not complete. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await currentUser();
  if (user) redirect(HOME_BY_ROLE[user.role]);
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  const googleError = typeof error === "string" ? GOOGLE_ERRORS[error] : undefined;
  const google = googleConfig() !== null;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <main className="flex flex-col px-[var(--gutter)] py-[var(--space-lg)]">
        <Wordmark />
        <div className="my-auto w-full max-w-[24rem] self-center py-[var(--space-2xl)]">
          <div className="mb-[var(--space-xl)] grid gap-2">
            <h1>Sign in</h1>
            <p className="text-muted">Use your university ID or college email.</p>
          </div>
          {googleError ? (
            <p role="alert" className="alert mb-[var(--space-md)]">
              {googleError}
            </p>
          ) : null}
          <SignInForm next={nextPath} />
          {google ? (
            <div className="mt-[var(--space-lg)] grid gap-[var(--space-md)]">
              <p className="flex items-center gap-[var(--space-sm)] text-sm text-muted before:h-px before:flex-1 before:bg-[var(--color-rule)] after:h-px after:flex-1 after:bg-[var(--color-rule)]">
                or
              </p>
              <GoogleButton
                href={`/api/v1/auth/google${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
                label="Continue with Google"
              />
            </div>
          ) : null}
        </div>
      </main>
      <aside className="hidden border-l border-ink lg:block" aria-hidden="true">
        <StackMap title="Plan of the library floor" />
      </aside>
    </div>
  );
}
