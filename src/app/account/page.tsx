import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth/current";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();
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
      <h2 className="mb-[var(--space-lg)]">Change password</h2>
      <ChangePasswordForm />
    </>
  );
}
