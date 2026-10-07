import type { Metadata } from "next";
import { PrintButton } from "@/components/admin/print-button";
import { PageHeader } from "@/components/layout/app-shell";
import { formatOrdinal } from "@/lib/format";
import { requireUser } from "@/server/auth/current";
import { labelsFor } from "@/server/labels";

export const metadata: Metadata = { title: "Copy labels" };

export default async function LabelsPage({ searchParams }: PageProps<"/admin/labels">) {
  await requireUser("LIBRARIAN");
  const { book, barcodes } = await searchParams;
  const bookId = typeof book === "string" && /^\d+$/.test(book) ? Number(book) : undefined;
  const codes =
    typeof barcodes === "string"
      ? barcodes
          .split(",")
          .map((code) => code.trim().toUpperCase())
          .filter((code) => /^LS\d{8}$/.test(code))
      : [];
  const labels = await labelsFor(bookId ? { bookId } : { barcodes: codes });

  return (
    <>
      <PageHeader
        title="Copy labels"
        description="Each QR opens the copy's page on any phone, and the desk, kiosk and stocktake scanners read it."
      />
      {labels.length === 0 ? (
        <p className="text-muted">
          Nothing to print. Open labels from a book in the catalogue, or pass barcodes in the
          address.
        </p>
      ) : (
        <>
          <div className="mb-[var(--space-lg)] flex flex-wrap items-center gap-[var(--space-md)]">
            <PrintButton label={`Print ${labels.length} labels`} />
            <p className="text-sm text-muted">
              Laid out for A4 sheets of 21 labels, 63.5 by 38.1 mm. Print at actual size.
            </p>
          </div>
          <div className="print-area label-sheet">
            {labels.map((label) => (
              <div key={label.barcode} className="copy-label">
                {/* biome-ignore lint/performance/noImgElement: a generated SVG data URI, not a remote image */}
                <img src={label.qr} alt="" className="copy-label-qr" />
                <div className="grid content-between">
                  <div>
                    <p className="copy-label-title">{label.title}</p>
                    <p className="copy-label-meta">{formatOrdinal(label.editionNo)} edition</p>
                  </div>
                  <div>
                    <p className="copy-label-barcode">{label.barcode}</p>
                    <p className="copy-label-meta">
                      {label.rack}, shelf {label.shelf}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
