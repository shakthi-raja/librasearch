import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { StackMap } from "@/components/stack-map/stack-map";

// Lending rules shown on the rack card are the library's real defaults.
const RACK_CARD = [
  ["Section", "Computer science"],
  ["Regular loan", "14 days"],
  ["Short loan", "3 days"],
  ["Hold pickup", "48 hours"],
] as const;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="container-app grid items-center gap-[var(--gap-columns)] py-[var(--space-2xl)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="grid gap-[var(--space-lg)]">
            <h1 className="text-[length:var(--text-4xl)] leading-none">
              Find the chapter your syllabus means.
            </h1>
            <p className="text-lg text-ink-2">
              Search by meaning, see the copy on the shelf, borrow it.
            </p>
            <div>
              <Link href="/login" className="btn btn-primary btn-lg">
                Sign in
              </Link>
            </div>
          </div>

          <figure className="relative m-0">
            <div className="aspect-[3/2] overflow-hidden rounded-[var(--radius-card)] border border-ink">
              <StackMap
                title="Plan of the library floor with three racks marked"
                fit="contain"
                route
                pins={[
                  { rack: "CS-04", kind: "available", label: "CS-04", open: true },
                  { rack: "RES-01", kind: "hold-shelf", label: "RES-01" },
                  { rack: "MA-02", kind: "on-loan", label: "MA-02" },
                ]}
              />
            </div>
            <div className="entry absolute right-[var(--space-md)] bottom-[var(--space-md)] hidden w-[17rem] sm:block">
              <div className="entry-head flex items-baseline justify-between px-[var(--space-md)] py-[var(--space-sm)]">
                <span className="text-sm font-medium">On the shelf</span>
                <span className="figure text-[length:var(--text-2xl)]">CS-04</span>
              </div>
              <dl className="notebook grid grid-cols-2 border-t border-ink">
                {RACK_CARD.map(([term, value], i) => (
                  <div
                    key={term}
                    className={`grid gap-0.5 border-ink px-[var(--space-md)] py-[var(--space-xs)] ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b" : ""}`}
                  >
                    <dt className="text-xs text-muted">{term}</dt>
                    <dd className="m-0 text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <figcaption className="mt-[var(--space-xs)] flex flex-wrap gap-x-[var(--space-md)] gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <svg
                  viewBox="-8 -8 16 16"
                  width="12"
                  height="12"
                  aria-hidden="true"
                  className="fill-ink"
                >
                  <circle r="6" />
                </svg>
                On the shelf
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg
                  viewBox="-8 -8 16 16"
                  width="12"
                  height="12"
                  aria-hidden="true"
                  className="fill-ink"
                >
                  <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" />
                </svg>
                Waiting on the hold shelf
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg
                  viewBox="-8 -8 16 16"
                  width="12"
                  height="12"
                  aria-hidden="true"
                  className="fill-ink"
                >
                  <path d="M0 -7 L6.5 5 L-6.5 5 Z" />
                </svg>
                On loan
              </span>
            </figcaption>
          </figure>
        </section>
      </main>
    </>
  );
}
