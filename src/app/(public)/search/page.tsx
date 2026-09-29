import type { RowDataPacket } from "mysql2/promise";
import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/server/auth/current";
import { pool } from "@/server/db/pool";
import type { CourseCard } from "@/server/search/course";
import {
  runSearch,
  type SearchFilters,
  type SearchMode,
  type SearchResult,
} from "@/server/search/run";

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
  const result = query
    ? await runSearch(query, mode, filters, user ? { userId: user.userId, role: user.role } : null)
    : null;

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

      {result && result.understood.expansions.length > 0 ? (
        <p role="status" className="text-ink-2">
          Searching for{" "}
          {result.understood.expansions.map((e, index) => (
            <span key={e.alias}>
              {index > 0 ? ", " : ""}
              <span className="font-medium">{e.expansion}</span> ({e.alias})
            </span>
          ))}
          .{" "}
          <Link
            href={`/search?q=${encodeURIComponent(`"${result.understood.original}"`)}&mode=keyword`}
            className="text-sm underline underline-offset-4"
          >
            Search the exact words instead
          </Link>
        </p>
      ) : null}

      {result?.course ? <CourseSummary course={result.course} /> : null}

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

          {result.books.length > 0 ? <BookMatches books={result.books} /> : null}

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
                    {hit.inSyllabus ? (
                      <span className="chip chip-signal">
                        Your syllabus: {hit.inSyllabus.courseCode} unit {hit.inSyllabus.unitNo}
                      </span>
                    ) : hit.prescribedFor.length > 0 ? (
                      <span className="chip">Prescribed for {hit.prescribedFor.join(", ")}</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted">{whyMatched(hit, result.mode)}</p>
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

function CourseSummary({ course }: { course: CourseCard }) {
  return (
    <section
      aria-labelledby="course-heading"
      className="grid gap-[var(--space-md)] border border-ink p-[var(--space-lg)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div className="grid content-start gap-[var(--space-xs)]">
        <p className="figure text-sm text-muted">
          {course.code} / semester {course.semester}
        </p>
        <h2 id="course-heading" className="text-xl">
          {course.title}
        </h2>
        {course.description ? <p className="text-sm text-ink-2">{course.description}</p> : null}
        <ol className="mt-[var(--space-xs)] grid gap-1 text-sm">
          {course.units.map((unit) => (
            <li key={unit.unitNo}>
              <span className="figure text-muted">Unit {unit.unitNo}</span> {unit.title}
            </li>
          ))}
        </ol>
      </div>
      <div className="grid content-start gap-[var(--space-xs)]">
        <h3 className="text-sm font-medium">Prescribed books</h3>
        {course.books.length === 0 ? (
          <p className="text-sm text-muted">The syllabus names no books this library holds.</p>
        ) : (
          <ul className="ruled text-sm">
            {course.books.map((book) => (
              <li key={book.bookId} className="flex items-baseline justify-between gap-2 py-1.5">
                <Link
                  href={`/catalog/${book.bookId}`}
                  className="underline-offset-4 hover:underline"
                >
                  {book.title}
                </Link>
                <span className="shrink-0 text-muted">
                  {book.role === "TEXTBOOK" ? "Textbook" : "Reference"},{" "}
                  {book.available > 0 ? `${book.available} in` : "all out"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** One line on why a result is here, in the words a student would use. */
function whyMatched(hit: SearchResult["hits"][number], mode: SearchMode) {
  const reasons: string[] = [];
  const byMeaning = mode === "semantic" || (mode === "hybrid" && hit.sources?.semantic);
  if (byMeaning && hit.similarity > 0) {
    reasons.push(`close in meaning (${Math.round(hit.similarity * 100)}%)`);
  }
  if (mode === "keyword" || hit.sources?.keyword) reasons.push("uses your words");
  if (hit.inSyllabus) {
    reasons.push(`approved for unit ${hit.inSyllabus.unitNo}, ${hit.inSyllabus.unitTitle}`);
  }
  if (reasons.length === 0) return "";
  const sentence = reasons.join("; ");
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}

function BookMatches({ books }: { books: SearchResult["books"] }) {
  return (
    <div className="grid gap-[var(--space-xs)]">
      <h3 className="text-sm font-medium">Books on this topic</h3>
      <ul className="flex flex-wrap gap-[var(--space-xs)]">
        {books.map((book) => (
          <li key={book.bookId}>
            <Link
              href={`/catalog/${book.bookId}`}
              className="grid max-w-[18rem] gap-0.5 rounded-[var(--radius-card)] border border-rule px-[var(--space-sm)] py-[var(--space-xs)] text-sm hover:border-ink"
            >
              <span className="font-medium">{book.title}</span>
              <span className="text-xs text-muted">
                {book.authors.split(", ")[0]}
                {book.latestYear ? `, ${book.latestYear}` : ""} /{" "}
                {book.available > 0 ? `${book.available} on the shelf` : "all copies out"}
              </span>
              {book.prescribedFor.length > 0 ? (
                <span className="text-xs text-ink-2">
                  Prescribed for {book.prescribedFor.join(", ")}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
