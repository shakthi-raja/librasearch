import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { StockScanner } from "@/components/stocktake/stock-scanner";
import type { StockCopy } from "@/lib/circulation/stocktake";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { AppError } from "@/server/http/errors";
import { getStocktake, stocktakeReport } from "@/server/services/stocktake";
import { closeStocktakeAction } from "../actions";

export const metadata: Metadata = { title: "Stocktake" };

const STATUS: Record<string, string> = {
  AVAILABLE: "on the shelf",
  ON_LOAN: "on loan",
  ON_HOLD_SHELF: "on the hold shelf",
  LOST: "lost",
  DAMAGED: "being repaired",
};

export default async function StocktakeDetail({
  params,
}: PageProps<"/admin/stocktake/[stocktakeId]">) {
  await requireUser("LIBRARIAN");
  const id = Number((await params).stocktakeId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const stocktake = await getStocktake(id).catch((error: unknown) => {
    if (error instanceof AppError) notFound();
    throw error;
  });
  const report = await stocktakeReport(id);

  return (
    <>
      <PageHeader
        title={`Stocktake of ${stocktake.rack}`}
        description={`Started ${formatDateTime(stocktake.startedAt)}${stocktake.closedAt ? `, closed ${formatDateTime(stocktake.closedAt)}` : ""}.`}
      />
      <p className="mb-[var(--space-lg)] text-sm">
        <Link href="/admin/stocktake" className="underline underline-offset-4">
          All stocktakes
        </Link>
      </p>

      {stocktake.closedAt ? null : (
        <section aria-label="Scanning" className="mb-[var(--space-2xl)]">
          <StockScanner stocktakeId={id} />
        </section>
      )}

      <div className="grid gap-[var(--space-xl)] md:grid-cols-2">
        <CopyList title={`Found (${report.found.length})`} copies={report.found} />
        <CopyList
          title={`Missing (${report.missing.length})`}
          copies={report.missing}
          note="Expected on this rack, not scanned yet."
        />
        <CopyList
          title={`Misplaced (${report.misplaced.length})`}
          copies={report.misplaced}
          note="Scanned here, belongs elsewhere."
          showRack
        />
        <CopyList
          title={`Not expected here (${report.unexpected.length})`}
          copies={report.unexpected}
          note="On the shelf although the records say otherwise."
          showStatus
        />
      </div>

      {stocktake.closedAt ? null : (
        <form
          action={closeStocktakeAction}
          className="mt-[var(--space-2xl)] grid max-w-[40rem] gap-[var(--space-sm)] border-t border-ink pt-[var(--space-lg)]"
        >
          <input type="hidden" name="stocktakeId" value={id} />
          <label className="flex items-start gap-[var(--space-xs)] text-sm">
            <input type="checkbox" name="markLost" className="mt-1" />
            Mark the {report.missing.length} missing{" "}
            {report.missing.length === 1 ? "copy" : "copies"} as lost. The change is recorded in the
            audit log and can be undone from the catalogue.
          </label>
          <button type="submit" className="btn justify-self-start">
            Close the stocktake
          </button>
        </form>
      )}
    </>
  );
}

function CopyList({
  title,
  copies,
  note,
  showRack,
  showStatus,
}: {
  title: string;
  copies: StockCopy[];
  note?: string;
  showRack?: boolean;
  showStatus?: boolean;
}) {
  return (
    <section className="grid content-start gap-[var(--space-xs)]">
      <h2 className="text-lg">{title}</h2>
      {note ? <p className="text-xs text-muted">{note}</p> : null}
      {copies.length === 0 ? (
        <p className="text-sm text-muted">None.</p>
      ) : (
        <ul className="ruled text-sm">
          {copies.map((copy) => (
            <li key={copy.copyId} className="flex items-baseline justify-between gap-2 py-1.5">
              <span>
                <span className="figure">{copy.barcode}</span> {copy.title}
              </span>
              <span className="shrink-0 text-muted">
                {showRack
                  ? copy.rack
                  : showStatus
                    ? (STATUS[copy.status] ?? copy.status)
                    : copy.shelf}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
