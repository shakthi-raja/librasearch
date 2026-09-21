import type { Metadata } from "next";
import { ActionForm, Field } from "@/components/forms/action-form";
import { PageHeader } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth/current";
import { librarySettings } from "@/server/services/settings";
import { settingsAction } from "./actions";

export const metadata: Metadata = { title: "Settings" };

const money = { min: 0, step: "0.01", className: "input" } as const;

export default async function SettingsPage() {
  await requireUser("LIBRARIAN");
  const settings = await librarySettings();

  return (
    <>
      <PageHeader
        title="Library settings"
        description="The numbers the desk, the fines and the demand planner run on."
      />

      <ActionForm action={settingsAction} submitLabel="Save settings">
        <fieldset className="grid gap-[var(--space-sm)] md:grid-cols-2">
          <legend className="mb-[var(--space-xs)] text-sm font-medium">Fines</legend>
          <Field label="Fine per overdue day (Rs)">
            <input name="finePerDay" type="number" {...money} defaultValue={settings.finePerDay} />
          </Field>
          <Field label="Fine cap (Rs)">
            <input name="fineCap" type="number" {...money} defaultValue={settings.fineCap} />
          </Field>
          <Field label="Lost copy fee (Rs)">
            <input
              name="lostCopyFee"
              type="number"
              {...money}
              defaultValue={settings.lostCopyFee}
            />
          </Field>
          <Field label="Block borrowing above (Rs)">
            <input
              name="unpaidFineThreshold"
              type="number"
              {...money}
              defaultValue={settings.unpaidFineThreshold}
            />
          </Field>
        </fieldset>

        <fieldset className="grid gap-[var(--space-sm)] md:grid-cols-2">
          <legend className="mb-[var(--space-xs)] text-sm font-medium">Loans and holds</legend>
          <Field label="Busy-period loan (days)">
            <input
              name="busyLoanDays"
              type="number"
              min={1}
              max={30}
              className="input"
              defaultValue={settings.busyLoanDays}
            />
          </Field>
          <Field label="Short loan (days)">
            <input
              name="shortLoanDays"
              type="number"
              min={1}
              max={30}
              className="input"
              defaultValue={settings.shortLoanDays}
            />
          </Field>
          <Field label="Waiting members for a busy loan">
            <input
              name="waitsForBusyLoan"
              type="number"
              min={1}
              max={50}
              className="input"
              defaultValue={settings.waitsForBusyLoan}
            />
          </Field>
          <Field label="Hold pickup window (hours)">
            <input
              name="holdExpiryHours"
              type="number"
              min={1}
              max={336}
              className="input"
              defaultValue={settings.holdExpiryHours}
            />
          </Field>
        </fieldset>

        <fieldset className="grid gap-[var(--space-sm)] md:grid-cols-2">
          <legend className="mb-[var(--space-xs)] text-sm font-medium">Demand and search</legend>
          <Field label="Shortage flag above (students)">
            <input
              name="shortageThreshold"
              type="number"
              min={0.01}
              step="0.01"
              className="input"
              defaultValue={settings.shortageThreshold}
            />
          </Field>
          <Field label="Weak mapping score below">
            <input
              name="weakMatchThreshold"
              type="number"
              min={0}
              max={1}
              step="0.001"
              className="input"
              defaultValue={settings.weakMatchThreshold}
            />
          </Field>
        </fieldset>
      </ActionForm>
    </>
  );
}
