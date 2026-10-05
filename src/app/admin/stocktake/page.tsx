import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { BAYS } from "@/components/stack-map/layout";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { listStocktakes } from "@/server/services/stocktake";
import { startStocktakeAction } from "./actions";

export const metadata: Metadata = { title: "Stocktake" };

export default async function StocktakePage() {
  await requireUser("LIBRARIAN");
  const stocktakes = await listStocktakes();

  return (
    <>
      <PageHeader
        title="Stocktake"
        description="Walk one rack with a phone, scan every copy on it, and see what is missing, misplaced or not where the records say."
      />
      <form
        action={startStocktakeAction}
        className="mb-[var(--space-2xl)] flex flex-wrap items-end gap-[var(--space-sm)]"
      >
        <label className="grid gap-1 text-sm font-medium">
          Rack
          <select name="rack" className="select" required>
            {BAYS.map((bay) => (
              <optgroup key={bay.id} label={bay.label}>
                {bay.racks.map((rack) => (
                  <option key={rack.code} value={rack.code}>
                    {rack.code}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary">
          Start a stocktake
        </button>
      </form>

      <h2 className="mb-[var(--space-sm)] text-lg">Recent stocktakes</h2>
      {stocktakes.length === 0 ? (
        <p className="text-muted">No rack has been counted yet.</p>
      ) : (
        <table className="table max-w-[48rem]">
          <thead>
            <tr>
              <th scope="col">Rack</th>
              <th scope="col">Started</th>
              <th scope="col">Scanned</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {stocktakes.map((s) => (
              <tr key={s.stocktakeId}>
                <td>
                  <Link
                    href={`/admin/stocktake/${s.stocktakeId}`}
                    className="figure underline underline-offset-4"
                  >
                    {s.rack}
                  </Link>
                </td>
                <td>{formatDateTime(s.startedAt)}</td>
                <td className="figure">{s.scanned}</td>
                <td>{s.closedAt ? "Closed" : "Open"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
