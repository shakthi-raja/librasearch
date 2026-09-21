import type { Metadata } from "next";
import { ActionForm, Field } from "@/components/forms/action-form";
import { PageHeader } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth/current";
import { sendNoticeAction } from "./actions";

export const metadata: Metadata = { title: "Notices" };

export default async function AdminNoticesPage() {
  await requireUser("LIBRARIAN");

  return (
    <>
      <PageHeader
        title="Notices"
        description="A short message to students, to faculty, or to both."
      />

      <div className="max-w-[54rem]">
        <ActionForm action={sendNoticeAction} submitLabel="Send notice">
          <div className="grid gap-[var(--space-sm)] md:grid-cols-2">
            <Field label="Audience">
              <select name="audience" className="select" defaultValue="STUDENT">
                <option value="STUDENT">Students</option>
                <option value="FACULTY">Faculty</option>
                <option value="BOTH">Everyone</option>
              </select>
            </Field>
            <Field label="Link (optional)">
              <input name="link" maxLength={300} placeholder="/catalog" className="input" />
            </Field>
          </div>
          <Field label="Title">
            <input name="title" required maxLength={120} className="input" />
          </Field>
          <Field label="Message">
            <textarea name="body" required maxLength={500} rows={4} className="input" />
          </Field>
        </ActionForm>
      </div>
    </>
  );
}
