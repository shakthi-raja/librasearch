import type { Metadata } from "next";
import { RebuildButton } from "@/components/admin/rebuild-button";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { vectorStatus } from "@/server/services/vector-console";

export const metadata: Metadata = { title: "Vector console" };

function drift(actual: number | null, expected: number) {
  if (actual === null) return "down";
  if (actual === expected) return "in step";
  return `${actual - expected > 0 ? "+" : ""}${actual - expected}`;
}

export default async function VectorPage() {
  await requireUser("LIBRARIAN");
  const status = await vectorStatus();

  return (
    <>
      <PageHeader
        title="Vector console"
        description="What Qdrant holds, what MySQL expects, and the jobs that carry one to the other."
      />

      <section aria-labelledby="drift-heading" className="grid gap-[var(--space-sm)]">
        <h2 id="drift-heading" className="text-lg">
          Drift
        </h2>
        <ul className="ruled max-w-[54rem]">
          {Object.entries(status.expected).map(([collection, expected]) => (
            <li
              key={collection}
              className="flex flex-wrap items-baseline justify-between gap-[var(--space-sm)] py-[var(--space-sm)]"
            >
              <p className="figure">{collection}</p>
              <p className="text-sm text-muted">
                Qdrant {status.qdrant[collection] ?? "unavailable"} / MySQL {expected} /{" "}
                <span className="text-ink">
                  {drift(status.qdrant[collection] ?? null, expected)}
                </span>
              </p>
            </li>
          ))}
        </ul>
        <RebuildButton />
      </section>

      <section
        aria-labelledby="outbox-heading"
        className="mt-[var(--space-2xl)] grid gap-[var(--space-sm)]"
      >
        <h2 id="outbox-heading" className="text-lg">
          Outbox
        </h2>
        {status.outbox.length === 0 ? (
          <p className="text-muted">No jobs yet.</p>
        ) : (
          <p className="text-sm">
            {status.outbox.map((row) => `${row.count} ${row.status.toLowerCase()}`).join(" / ")}
          </p>
        )}
        <ul className="ruled max-w-[64rem]">
          {status.jobs.map((job) => (
            <li
              key={Number(job.job_id)}
              className="grid gap-1 py-[var(--space-sm)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline"
            >
              <p className="text-sm">
                <span className="figure">#{Number(job.job_id)}</span> {job.operation}{" "}
                {String(job.entity_type).toLowerCase()} {Number(job.entity_id)}
              </p>
              <p className="text-sm text-muted sm:text-right">
                {job.status.toLowerCase()} / attempt {Number(job.attempts)} /{" "}
                {formatDateTime(new Date(job.created_at))}
              </p>
              {job.last_error ? (
                <p className="text-sm text-error sm:col-span-2">{job.last_error}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
