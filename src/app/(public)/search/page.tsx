import type { RowDataPacket } from "mysql2/promise";
import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/server/auth/current";
import { pool } from "@/server/db/pool";
import { runSearch, type SearchFilters, type SearchMode } from "@/server/search/run";

export const metadata: Metadata = { title: "Search" };

type Params = {
  q?: string;
  mode?: string;
  category?: string;
  language?: string;
  yearFrom?: string;
  yearTo?: string;
};

const number = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const mode: SearchMode =
    params.mode === "semantic" || params.mode === "keyword" ? params.mode : "hybrid";
  const yearFrom = number(params.yearFrom);
  const yearTo = number(params.yearTo);
  const filters: SearchFilters = {
    ...(params.category ? { categorySlug: params.category } : {}),
    ...(params.language ? { language: params.language } : {}),
    ...(yearFrom !== undefined ? { yearFrom } : {}),
    ...(yearTo !== undefined ? { yearTo } : {}),
  };

  const db = pool("student");
  const [categories] = await db.query<RowDataPacket[]>(
    "SELECT slug, name, path, depth FROM v_category_tree ORDER BY path",
  );
  const [languages] = await db.query<RowDataPacket[]>(
    "SELECT DISTINCT language FROM books WHERE status = 'ACTIVE' ORDER BY language",
  );

  const user = query ? await currentUser() : null;
  const result = query ? await runSearch(query, mode, filters, user?.userId ?? null) : null;

  return (
    <div className="grid gap-[var(--space-2xl)]">
      <header className="grid max-w-[62rem] gap-[var(--space-md)]">
        <p className="text-sm text-muted">Discovery</p>
        <h1 className="text-[length:var(--text-4xl)]">Search the shelves</h1>
        <p className="max-w-[58ch] text-ink-2">
          Find a chapter by what it says, not only by the words in its title. Semantic and keyword
          matches are fused, and the shelf tells you where to go.
        </p>

        <form
          action="/search"
          method="get"
          className="grid gap-[var(--space-sm)] border-y border-ink py-[var(--space-md)]"
        >
          <div className="flex flex-wrap gap-[var(--space-sm)]">
            <label className="grid min-w-[16rem] flex-[2] gap-1 text-sm font-medium">
              What are you looking for?
              <input
                name="q"
                defaultValue={query}
                placeholder="normalisation, distributed consensus, indexing"
                className="input"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Matching
              <select name="mode" defaultValue={mode} className="select">
                <option value="hybrid">Meaning and words</option>
                <option value="semantic">Meaning only</option>
                <option value="keyword">Words only</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-[var(--space-sm)]">
            <label className="grid gap-1 text-sm font-medium">
              Subject
              <select name="category" defaultValue={params.category ?? ""} className="select">
                <option value="">Any subject</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {"  ".repeat(Number(category.depth))}
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Language
              <select name="language" defaultValue={params.language ?? ""} className="select">
                <option value="">Any language</option>
                {languages.map((row) => (
                  <option key={row.language} value={row.language}>
                    {row.language}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid w-[6.5rem] gap-1 text-sm font-medium">
              From year
              <input
                name="yearFrom"
                type="number"
                min={1900}
                max={2100}
                defaultValue={params.yearFrom ?? ""}
                className="input"
              />
            </label>
            <label className="grid w-[6.5rem] gap-1 text-sm font-medium">
              To year
              <input
                name="yearTo"
                type="number"
                min={1900}
                max={2100}
                defaultValue={params.yearTo ?? ""}
                className="input"
              />
            </label>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </form>
      </header>

      {result?.semanticDown ? (
        <p role="status" className="border-l-2 border-signal pl-[var(--space-sm)] text-sm">
          Semantic search is unavailable, so these are keyword matches. Try again in a moment.
        </p>
      ) : null}

      {result ? (
        <section aria-labelledby="results-heading" className="grid gap-[var(--space-md)]">
          <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-sm)]">
            <h2 id="results-heading" className="text-lg">
              {result.hits.length === 1 ? "One chapter" : `${result.hits.length} chapters`}
            </h2>
            <p className="text-sm text-muted">
              {result.mode === "hybrid"
                ? "Meaning and words, fused by rank"
                : result.mode === "semantic"
                  ? "Nearest chapters by meaning"
                  : "Best keyword matches"}
            </p>
          </div>

          {result.hits.length === 0 ? (
            <p className="text-muted">
              Nothing matched. Try a broader phrase, another subject, or drop the year limits.
            </p>
          ) : (
            <ul className="ruled">
              {result.hits.map((hit) => (
                <li key={hit.chapterId} className="grid gap-[var(--space-xs)] py-[var(--space-lg)]">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-[var(--space-md)] gap-y-1">
                    <h3 className="text-lg">
                      <Link
                        href={`/catalog/${hit.bookId}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {hit.bookTitle}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted">
                      Chapter {hit.chapterNo}: {hit.chapterTitle}
                    </p>
                  </div>
                  <p className="text-sm text-muted">
                    {hit.authors} / {hit.categoryPath}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-[var(--space-md)] gap-y-1 text-sm">
                    <span className={hit.available > 0 ? "chip chip-in-date" : "chip chip-error"}>
                      {hit.available > 0 ? `${hit.available} on the shelf` : "All copies are out"}
                    </span>
                    {hit.available > 0 && hit.rack ? (
                      <span className="figure">
                        {hit.rack}, shelf {hit.shelf}
                      </span>
                    ) : null}
                    {hit.sources ? (
                      <span className="text-muted">
                        {hit.sources.semantic ? `meaning #${hit.sources.semantic}` : ""}
                        {hit.sources.semantic && hit.sources.keyword ? " / " : ""}
                        {hit.sources.keyword ? `words #${hit.sources.keyword}` : ""}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p className="max-w-[54rem] text-muted">
          Ask for a topic, a problem, or a phrase you remember. Results show the chapter and the
          shelf its copies sit on.
        </p>
      )}
    </div>
  );
}
