import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/components/catalog/book-cover";
import { StackMap } from "@/components/stack-map/stack-map";
import { formatDate, formatOrdinal } from "@/lib/format";
import { currentUser } from "@/server/auth/current";
import { pool } from "@/server/db/pool";
import { type CopyLookup, findCopyByBarcode } from "@/server/repositories/copy-lookup";

export const metadata: Metadata = { title: "Copy" };

const STATE: Record<CopyLookup["status"], string> = {
  AVAILABLE: "On the shelf",
  ON_LOAN: "On loan",
  ON_HOLD_SHELF: "Waiting on the hold shelf",
  LOST: "Reported lost",
  DAMAGED: "Being repaired",
};

/** The page a copy label's QR opens: what the copy is, where it lives, whether it is in. */
export default async function CopyPage({ params }: PageProps<"/c/[barcode]">) {
  const { barcode } = await params;
  const code = barcode.toUpperCase();
  if (!/^LS\d{8}$/.test(code)) notFound();
  const copy = await findCopyByBarcode(pool("student"), code);
  if (!copy) notFound();
  const user = await currentUser();
  const reference = copy.loanPolicy === "REFERENCE_ONLY";

  return (
    <article className="grid gap-[var(--space-xl)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="grid content-start gap-[var(--space-md)]">
        <p className="figure text-sm text-muted">Copy {copy.barcode}</p>
        <div className="flex items-start gap-[var(--space-md)]">
          <BookCover src={copy.coverUrl} title={copy.title} size="md" />
          <div className="grid gap-1">
            <h1 className="text-[length:var(--text-2xl)]">
              <Link href={`/catalog/${copy.bookId}`} className="underline-offset-4 hover:underline">
                {copy.title}
              </Link>
            </h1>
            <p className="text-sm text-muted">
              {formatOrdinal(copy.editionNo)} edition, {copy.pubYear}
            </p>
          </div>
        </div>

        <dl className="ruled grid max-w-[30rem]">
          {[
            ["State", STATE[copy.status]],
            ["Belongs on", `${copy.rack}, shelf ${copy.shelf}`],
            ["Lending", reference ? "Reading room only" : "Can be borrowed"],
            ...(copy.dueAt ? [["Due back", formatDate(copy.dueAt)]] : []),
          ].map(([term, value]) => (
            <div
              key={term}
              className="grid grid-cols-[8rem_minmax(0,1fr)] gap-[var(--space-md)] py-[var(--space-xs)]"
            >
              <dt className="text-sm text-muted">{term}</dt>
              <dd className="m-0">{value}</dd>
            </div>
          ))}
        </dl>

        {user?.role === "LIBRARIAN" ? (
          <div className="flex flex-wrap gap-[var(--space-sm)]">
            {copy.status === "ON_LOAN" ? (
              <Link
                href={`/admin/circulation?mode=return&copy=${copy.barcode}`}
                className="btn btn-primary"
              >
                Return at the desk
              </Link>
            ) : (
              <Link
                href={`/admin/circulation?mode=issue&copy=${copy.barcode}`}
                className="btn btn-primary"
              >
                Issue at the desk
              </Link>
            )}
            <Link href={`/admin/catalog/${copy.bookId}`} className="btn">
              Catalogue record
            </Link>
          </div>
        ) : copy.status === "AVAILABLE" && !reference ? (
          <p className="text-sm text-ink-2">
            Take it to the issue desk or a self-checkout kiosk to borrow it.
          </p>
        ) : copy.status === "ON_LOAN" ? (
          <p className="text-sm text-ink-2">
            This copy is out.{" "}
            <Link href={`/catalog/${copy.bookId}`} className="underline underline-offset-4">
              See the other copies or place a hold
            </Link>
            .
          </p>
        ) : null}
      </div>

      <figure className="m-0">
        <div className="aspect-[3/2] overflow-hidden rounded-[var(--radius-card)] border border-ink">
          <StackMap
            title={`Where copy ${copy.barcode} belongs`}
            fit="contain"
            route
            pins={[
              {
                rack: copy.rack,
                label: copy.rack,
                open: true,
                kind:
                  copy.status === "AVAILABLE"
                    ? "available"
                    : copy.status === "ON_HOLD_SHELF"
                      ? "hold-shelf"
                      : "on-loan",
              },
            ]}
          />
        </div>
      </figure>
    </article>
  );
}
