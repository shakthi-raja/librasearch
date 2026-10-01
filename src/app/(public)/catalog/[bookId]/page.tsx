import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Availability } from "@/components/catalog/availability";
import { BookCover } from "@/components/catalog/book-cover";
import { PlaceHoldForm } from "@/components/holds/place-hold";
import { type MapPin, StackMap } from "@/components/stack-map/stack-map";
import { formatDateTime, formatOrdinal } from "@/lib/format";
import { currentUser } from "@/server/auth/current";
import { pool } from "@/server/db/pool";
import { type BookDetail, type CopyState, findBook } from "@/server/repositories/book";
import { alternativeChapters, similarBooks } from "@/server/search/similar";
import { getMemberHoldForBook } from "@/server/services/holds";

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
  const user = await currentUser();
  const canBorrow = user?.role === "STUDENT" || user?.role === "FACULTY";
  const hold =
    user && canBorrow ? await getMemberHoldForBook(book.bookId, user.userId, user.role) : null;
  const similar = await similarBooks(book.bookId);
  const firstChapter = book.editions.flatMap((edition) => edition.chapters)[0];
  const alternatives =
    borrowable === 0 && firstChapter ? await alternativeChapters(firstChapter.chapterId) : [];

  return (
    <article className="grid gap-[var(--space-2xl)]">
      <header className="grid items-start gap-[var(--gap-columns)] lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div className="grid gap-[var(--space-md)]">
          <Link href={`/catalog?category=${book.categorySlug}`} className="text-sm text-muted">
            {book.categoryPath}
          </Link>
          <div className="flex items-start gap-[var(--space-md)]">
            <BookCover src={book.coverUrl} title={book.title} size="lg" />
            <div className="grid gap-[var(--space-xs)]">
              <h1 className="max-w-[24ch] text-[length:var(--text-4xl)]">{book.title}</h1>
              {book.subtitle ? <p className="text-lg text-ink-2">{book.subtitle}</p> : null}
              <p className="text-ink-2">{book.authors}</p>
            </div>
          </div>
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

      {book.openResources.length > 0 ? (
        <section
          aria-labelledby="online-heading"
          className="grid gap-[var(--space-xs)] border-l-2 border-ink pl-[var(--space-md)]"
        >
          <h2 id="online-heading" className="text-lg">
            Read it online
          </h2>
          {book.openResources.map((resource) => (
            <p key={resource.url} className="text-sm text-ink-2">
              <a
                href={resource.url}
                className="font-medium underline underline-offset-4"
                rel="noopener"
              >
                {resource.kind === "CHAPTERS" ? "Free chapters" : "The full text"}
              </a>{" "}
              from {resource.provider}
              {resource.licence ? `, under ${resource.licence}` : ""}. The printed copies below are
              still here to borrow.
            </p>
          ))}
        </section>
      ) : null}

      <section
        aria-labelledby="borrowing-heading"
        className="grid gap-[var(--space-sm)] border-y border-rule py-[var(--space-lg)]"
      >
        <h2 id="borrowing-heading" className="text-lg">
          Borrowing
        </h2>

        {user?.role === "LIBRARIAN" ? (
          <p className="text-sm text-muted">
            Staff accounts do not borrow. Run the loan from the circulation desk.
          </p>
        ) : null}

        {!user ? (
          <p className="text-sm text-ink-2">
            {borrowable === 0 ? (
              <>
                Every copy is out.{" "}
                <Link
                  href={{ pathname: "/login", query: { next: `/catalog/${book.bookId}` } }}
                  className="underline underline-offset-2"
                >
                  Sign in to place a hold
                </Link>
                .
              </>
            ) : (
              <>
                A copy is on the shelf.{" "}
                <Link href="/login" className="underline underline-offset-2">
                  Sign in
                </Link>{" "}
                to borrow it at the issue desk.
              </>
            )}
          </p>
        ) : null}

        {canBorrow && hold ? (
          <div className="grid gap-1 text-sm">
            <p>
              {hold.status === "READY" ? (
                <>
                  Ready to collect from <span className="figure">{hold.readyRack}</span>
                  {hold.pickupBy ? (
                    <>
                      {" "}
                      by <span className="figure">{formatDateTime(hold.pickupBy)}</span>
                    </>
                  ) : null}
                  .
                </>
              ) : (
                <>
                  You are {formatOrdinal(hold.queuePosition)} in line. The next free copy is
                  reserved for you.
                </>
              )}
            </p>
            <Link href="/student" className="underline underline-offset-2">
              See your holds
            </Link>
          </div>
        ) : null}

        {canBorrow && !hold ? (
          borrowable === 0 ? (
            <div className="grid gap-[var(--space-sm)]">
              <p className="max-w-[65ch] text-sm text-ink-2">
                Every copy is out. A hold puts you in the queue and the desk sets it ready when a
                copy returns.
              </p>
              <PlaceHoldForm bookId={book.bookId} />
            </div>
          ) : (
            <p className="text-sm text-ink-2">
              There is a copy on the shelf; the issue desk writes the loan.
            </p>
          )
        ) : null}

        {alternatives.length > 0 ? (
          <div className="grid gap-[var(--space-xs)] border-t border-rule pt-[var(--space-sm)]">
            <h3 className="text-md">Chapters that cover the same ground</h3>
            <ul className="ruled">
              {alternatives.map((alternative) => (
                <li
                  key={alternative.chapterId}
                  className="flex flex-wrap items-baseline justify-between gap-[var(--space-sm)] py-[var(--space-xs)] text-sm"
                >
                  <span>
                    <Link
                      href={`/catalog/${alternative.bookId}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {alternative.bookTitle}
                    </Link>
                    , chapter {alternative.chapterNo}: {alternative.chapterTitle}
                  </span>
                  <span className="figure text-muted">
                    {alternative.rack} {alternative.shelf}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

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

      {similar.length > 0 ? (
        <section aria-labelledby="similar-heading" className="grid gap-[var(--space-sm)]">
          <h2 id="similar-heading" className="text-lg">
            Similar books
          </h2>
          <ul className="ruled">
            {similar.map((neighbour) => (
              <li
                key={neighbour.bookId}
                className="flex flex-wrap items-baseline justify-between gap-[var(--space-sm)] py-[var(--space-sm)]"
              >
                <span>
                  <Link
                    href={`/catalog/${neighbour.bookId}`}
                    className="text-lg underline-offset-4 hover:underline"
                  >
                    {neighbour.title}
                  </Link>
                  <span className="block text-sm text-muted">{neighbour.authors}</span>
                </span>
                <span className="text-sm text-muted">
                  {neighbour.available > 0
                    ? `${neighbour.available} on the shelf at ${neighbour.rack}`
                    : "All copies are out"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
