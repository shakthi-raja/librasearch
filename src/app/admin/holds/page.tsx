import type { Metadata } from "next";
import { HoldCancelButton } from "@/components/holds/cancel-button";
import { PageHeader } from "@/components/layout/app-shell";
import { formatDate, formatDateTime, formatOrdinal } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { getStaffHolds } from "@/server/services/holds";

export const metadata: Metadata = { title: "Holds" };

export default async function HoldsPage() {
  await requireUser("LIBRARIAN");
  const holds = await getStaffHolds();

  return (
    <>
      <PageHeader
        title="Holds"
        description="The queue in order, with the pickup deadline and the copy on the hold shelf."
      />

      {holds.length === 0 ? (
        <p className="max-w-[44rem] text-muted">
          No holds waiting. When a member reserves a book whose copies are all out, it appears here.
        </p>
      ) : (
        <ul className="ruled">
          {holds.map((hold) => (
            <li
              key={hold.holdId}
              className="grid gap-[var(--space-sm)] py-[var(--space-md)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] lg:items-start lg:gap-[var(--space-lg)]"
            >
              <div className="min-w-0">
                <h2 className="text-lg">{hold.title}</h2>
                <p className="text-sm text-muted">{hold.authors}</p>
                <p className="mt-1 text-sm">{formatOrdinal(hold.queuePosition)} in line</p>
              </div>

              <div className="grid gap-1 text-sm">
                <p className="font-medium text-ink">{hold.memberName}</p>
                <p className="figure text-muted">{hold.universityId}</p>
                <p className="text-muted">
                  Placed <span className="figure">{formatDate(hold.placedAt)}</span>
                </p>
                {hold.status === "READY" ? (
                  <p>
                    Collect from <span className="figure">{hold.readyRack}</span>
                    {hold.readyBarcode ? (
                      <>
                        , copy <span className="figure">{hold.readyBarcode}</span>
                      </>
                    ) : null}
                    {hold.pickupBy ? (
                      <>
                        {" "}
                        by <span className="figure">{formatDateTime(hold.pickupBy)}</span>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-start justify-end gap-[var(--space-sm)]">
                <span className={hold.status === "READY" ? "chip chip-signal" : "chip"}>
                  {hold.status === "READY" ? "Ready to collect" : "Waiting"}
                </span>
                <HoldCancelButton holdId={hold.holdId} label="Cancel" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
