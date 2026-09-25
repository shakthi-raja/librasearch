import type { Metadata } from "next";
import { GoogleButton } from "@/components/auth/google-button";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { googleConfig } from "@/server/auth/google";
import { googleLinkFor } from "@/server/services/google-auth";
import { unlinkGoogleAction } from "./actions";
import { ChangePasswordForm } from "./change-password-form";

const GOOGLE_STATUS: Record<string, { text: string; good: boolean }> = {
  linked: { text: "Google account linked. You can now sign in with it.", good: true },
  unlinked: { text: "Google account unlinked.", good: true },
  already: { text: "A Google account is already linked to this account.", good: false },
  in_use: { text: "That Google account is linked to someone else.", good: false },
  cancelled: { text: "Linking was cancelled.", good: false },
  failed: { text: "Linking did not complete. Please try again.", good: false },
};

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser();
  const { google: googleParam } = await searchParams;
  const status = typeof googleParam === "string" ? GOOGLE_STATUS[googleParam] : undefined;
  const link = await googleLinkFor(user.userId);
  const googleReady = googleConfig() !== null;
  return (
    <>
      <PageHeader title="Account" />
      <dl className="ruled mb-[var(--space-2xl)] grid max-w-[36rem]">
        {[
          ["Name", user.fullName],
          ["University ID", user.universityId],
          ["Email", user.email],
        ].map(([term, value]) => (
          <div
            key={term}
            className="grid grid-cols-[10rem_minmax(0,1fr)] gap-[var(--space-md)] py-[var(--space-sm)]"
          >
            <dt className="text-sm text-muted">{term}</dt>
            <dd className={`m-0 break-words ${term === "University ID" ? "figure" : ""}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <section
        aria-labelledby="google-heading"
        className="mb-[var(--space-2xl)] grid max-w-[36rem] gap-[var(--space-md)]"
      >
        <h2 id="google-heading">Google sign-in</h2>
        {status ? (
          <p role="status" className={status.good ? "notice-ok" : "alert"}>
            {status.text}
          </p>
        ) : null}
        {link ? (
          <>
            <p className="text-ink-2">
              Linked to <span className="font-medium">{link.email}</span> since{" "}
              {formatDate(link.linkedAt)}.
              {link.lastUsedAt ? ` Last used ${formatDate(link.lastUsedAt)}.` : " Not used yet."}
            </p>
            <form action={unlinkGoogleAction}>
              <button type="submit" className="btn">
                Unlink Google
              </button>
            </form>
          </>
        ) : googleReady ? (
          <>
            <p className="text-ink-2">
              Link a Google account to sign in without your password. Any Google address works; it
              does not have to match your college email.
            </p>
            <div className="max-w-[20rem]">
              <GoogleButton href="/api/v1/auth/google?intent=link" label="Link Google account" />
            </div>
          </>
        ) : (
          <p className="text-muted">Google sign-in is not set up for this library.</p>
        )}
      </section>

      <h2 className="mb-[var(--space-lg)]">Change password</h2>
      <ChangePasswordForm />
    </>
  );
}
