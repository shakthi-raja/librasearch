import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { auditTables, auditTrail } from "@/server/services/audit";

export const metadata: Metadata = { title: "Audit" };

const ACTION_CHIP: Record<string, string> = {
  INSERT: "chip chip-in-date",
  UPDATE: "chip chip-signal",
  DELETE: "chip chip-error",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  await requireUser("LIBRARIAN");
  const { table } = await searchParams;
  const filter = table && table !== "all" ? table : null;
  const [rows, tables] = await Promise.all([auditTrail(filter), auditTables()]);

  return (
    <>
      <PageHeader
        title="Audit trail"
        description="Every change a trigger or the desk wrote down, newest first."
      />

      <form
        method="get"
        className="mb-[var(--space-md)] flex flex-wrap items-end gap-[var(--space-sm)]"
      >
        <label className="grid gap-1 text-xs font-medium text-muted">
          Table
          <select name="table" defaultValue={filter ?? "all"} className="select">
            <option value="all">All tables</option>
            {tables.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn">
          Filter
        </button>
        <span className="text-muted text-sm">{rows.length} entries</span>
      </form>

      {rows.length === 0 ? (
        <p className="text-muted">No change matches that filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <caption className="sr-only">Audit entries, newest first</caption>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Table</th>
                <th scope="col">Action</th>
                <th scope="col">Who</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.auditId}>
                  <td className="text-sm">{formatDateTime(new Date(row.changedAt))}</td>
                  <td>
                    <p className="font-medium">{row.tableName}</p>
                    <p className="text-muted text-sm">#{row.recordId}</p>
                  </td>
                  <td>
                    <span className={ACTION_CHIP[row.action] ?? "chip"}>{row.action}</span>
                  </td>
                  <td>{row.actor ?? "System"}</td>
                  <td>
                    {row.changed.length === 0 ? (
                      <span className="text-muted text-sm">No field changed</span>
                    ) : (
                      <ul className="grid gap-1 text-sm">
                        {row.changed.map((change) => (
                          <li key={change.key}>
                            <span className="font-medium">{change.key}</span>{" "}
                            <span className="text-muted">
                              {change.from} &rarr; {change.to}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
