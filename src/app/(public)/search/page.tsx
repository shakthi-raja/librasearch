import type { Metadata } from "next";
import Link from "next/link";
import { Availability } from "@/components/catalog/availability";
import { Highlighted } from "@/components/search/highlighted";
import { SearchForm } from "@/components/search/search-form";
import { queryTerms } from "@/lib/search/highlight";
import { first } from "@/lib/url/list-params";
import { searchQuerySchema } from "@/lib/validation/search";
import { currentUser } from "@/server/auth/current";
import { keywordSearch } from "@/server/services/search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search chapters and books by topic, title or author.",
};

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const raw = first(params, "q") ?? "";
  const parsed = searchQuerySchema.safeParse({ q: raw });

  if (!parsed.success) {
    return (
      <div className="grid gap-[var(--space-lg)]">
        <h1>Search the library</h1>
        <SearchForm defaultValue={raw} />
        {raw ? <p className="text-muted">{parsed.error.issues[0]?.message}</p> : null}
      </div>
    );
  }

  const q = parsed.data.q;
  const user = await currentUser();
  const { chapters, books } = await keywordSearch(q, user?.userId ?? null);
  const terms = queryTerms(q);

  return (
    <div className="grid gap-[var(--space-xl)]">
      <div className="grid gap-[var(--space-md)]">
        <h1 className="max-w-none">Results for {q}</h1>
        <SearchForm defaultValue={q} />
        <p className="text-sm text-muted">
          Keyword match on chapter titles, summaries, book descriptions and authors.
        </p>
      </div>

      {chapters.length === 0 && books.length === 0 ? (
        <section className="ruled max-w-[44rem] py-[var(--space-lg)]">
          <h2 className="text-lg">No chapter uses those words</h2>
          <p className="mt-1 text-muted">
            Try the words a textbook would use, or fewer of them. Searches that find nothing are
            passed on to the library when it plans purchases.
          </p>
        </section>
      ) : (
        <div className="grid gap-[var(--space-2xl)] xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section aria-labelledby="chapters-heading" className="min-w-0">
            <h2 id="chapters-heading" className="mb-[var(--space-sm)]">
              Chapters
            </h2>
            <ol className="ruled">
              {chapters.map((c) => (
                <li key={c.chapterId} className="grid gap-[var(--space-xs)] py-[var(--space-md)]">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-[var(--space-md)] gap-y-1">
                    <h3 className="text-lg">
                      <Highlighted text={c.title} terms={terms} />
                    </h3>
                    <span className="text-xs text-muted tabular-nums">
                      keyword score {c.score.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-ink-2">
                    Chapter {c.chapterNo} in {c.bookTitle}, {ordinal(c.editionNo)} edition,{" "}
                    {c.pubYear}
                  </p>
                  <p className="max-w-[70ch] text-muted">
                    <Highlighted text={c.summary} terms={terms} />
                  </p>
                  <div className="flex flex-wrap items-center gap-[var(--space-sm)] text-sm">
                    <Availability available={c.availableCopies} total={c.totalCopies} />
                    {c.racks.length > 0 ? (
                      <span className="figure text-ink-2">{c.racks.join(", ")}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {books.length > 0 ? (
            <aside aria-labelledby="books-heading">
              <h2 id="books-heading" className="mb-[var(--space-sm)]">
                Books
              </h2>
              <ul className="ruled">
                {books.map((b) => (
                  <li key={b.bookId} className="grid gap-1 py-[var(--space-sm)]">
                    <Link href={`/catalog/${b.bookId}`} className="font-medium">
                      <Highlighted text={b.title} terms={terms} />
                    </Link>
                    <span className="text-sm text-muted">
                      <Highlighted text={b.authors} terms={terms} />
                    </span>
                    <span className="text-sm">
                      <Availability available={b.availableCopies} total={b.totalCopies} />
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      )}
    </div>
  );
}
