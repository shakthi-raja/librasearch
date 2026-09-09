import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Availability } from "@/components/catalog/availability";
import { type MapPin, StackMap } from "@/components/stack-map/stack-map";
import { pool } from "@/server/db/pool";
import { type BookDetail, type CopyState, findBook } from "@/server/repositories/book";

const STATE: Record<CopyState, string> = {
  AVAILABLE: "On the shelf",
  ON_LOAN: "On loan",
  ON_HOLD_SHELF: "Waiting on the hold shelf",
  LOST: "Lost",
  DAMAGED: "Being repaired",
  WITHDRAWN: "Withdrawn",
};

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

async function load(params: Promise<{ bookId: string }>): Promise<BookDetail> {
  const { bookId } = await params;
  const id = Number(bookId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const book = await findBook(pool("student"), id);
  if (!book) notFound();
  return book;
}

export async function generateMetadata({
  params,
}: PageProps<"/catalog/[bookId]">): Promise<Metadata> {
  const book = await load(params);
  return { title: book.title, description: book.description.slice(0, 160) };
}

/** One pin per rack the book sits on: a disc while any copy there is borrowable. */
function pinsFor(book: BookDetail): MapPin[] {
  const byRack = new Map<string, CopyState[]>();
  for (const copy of book.editions.flatMap((e) => e.copies)) {
    byRack.set(copy.rack, [...(byRack.get(copy.rack) ?? []), copy.status]);
  }
  return [...byRack].map(([rack, states], i) => ({
    rack,
    label: rack,
    open: i === 0,
    kind: states.includes("AVAILABLE")
      ? "available"
      : states.includes("ON_HOLD_SHELF")
        ? "hold-shelf"
        : "on-loan",
  }));
}

export default async function BookPage({ params }: PageProps<"/catalog/[bookId]">) {
  const book = await load(params);
  const copies = book.editions.flatMap((e) => e.copies);
  const borrowable = copies.filter(
    (c) => c.status === "AVAILABLE" && c.loanPolicy !== "REFERENCE_ONLY",
  ).length;
  const reference = copies.filter(
    (c) => c.status === "AVAILABLE" && c.loanPolicy === "REFERENCE_ONLY",
  ).length;

  return (
    <article className="grid gap-[var(--space-2xl)]">
      <header className="grid items-start gap-[var(--gap-columns)] lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div className="grid gap-[var(--space-md)]">
          <Link href={`/catalog?category=${book.categorySlug}`} className="text-sm text-muted">
            {book.categoryPath}
          </Link>
          <h1 className="max-w-[24ch] text-[length:var(--text-4xl)]">{book.title}</h1>
          {book.subtitle ? <p className="text-lg text-ink-2">{book.subtitle}</p> : null}
          <p className="text-ink-2">{book.authors}</p>
          <p className="max-w-[65ch] text-muted">{book.description}</p>
          <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
            <Availability available={borrowable} total={copies.length} reference={reference} />
            {reference > 0 ? (
              <span className="text-sm text-muted">{reference} to read in the library</span>
            ) : null}
          </div>
        </div>
        <figure className="m-0">
          <div className="aspect-[3/2] overflow-hidden rounded-[var(--radius-card)] border border-ink">
            <StackMap
              title={`Where ${book.title} is shelved`}
              fit="contain"
              route
              pins={pinsFor(book)}
            />
          </div>
        </figure>
      </header>

      {book.editions.map((edition) => (
        <section
          key={edition.editionId}
          aria-labelledby={`edition-${edition.editionId}`}
          className="grid gap-[var(--space-lg)]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-sm)] border-b border-ink pb-[var(--space-xs)]">
            <h2 id={`edition-${edition.editionId}`}>
              {ordinal(edition.editionNo)} edition, {edition.pubYear}
            </h2>
            <p className="text-sm text-muted">
              {edition.publisher ? `${edition.publisher}, ` : ""}
              {edition.pageCount} pages, ISBN{" "}
              <span className="figure text-ink-2">{edition.isbn13}</span>
            </p>
          </div>

          <div className="grid gap-[var(--space-xl)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <h3 className="mb-[var(--space-xs)] text-md">Chapters</h3>
              {edition.chapters.length === 0 ? (
                <p className="text-muted">
                  The table of contents for this edition has not been added yet.
                </p>
              ) : (
                <ol className="ruled">
                  {edition.chapters.map((c) => (
                    <li
                      key={c.chapterId}
                      className="grid grid-cols-[3rem_minmax(0,1fr)] gap-[var(--space-sm)] py-[var(--space-sm)]"
                    >
                      <span className="figure text-muted">{c.chapterNo}</span>
                      <div className="grid gap-1">
                        <span className="font-medium">{c.title}</span>
                        <span className="text-sm text-muted">{c.summary}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="mb-[var(--space-xs)] text-md">Copies</h3>
              {edition.copies.length === 0 ? (
                <p className="text-muted">The library holds no copy of this edition.</p>
              ) : (
                <ul className="ruled">
                  {edition.copies.map((copy) => (
                    <li
                      key={copy.copyId}
                      className="flex items-center justify-between gap-[var(--space-sm)] py-[var(--space-xs)] text-sm"
                    >
                      <span className="figure">
                        {copy.rack} {copy.shelf}
                      </span>
                      <span className={copy.status === "AVAILABLE" ? "chip chip-in-date" : "chip"}>
                        {copy.loanPolicy === "REFERENCE_ONLY" && copy.status === "AVAILABLE"
                          ? "Reading room only"
                          : STATE[copy.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ))}
    </article>
  );
}
