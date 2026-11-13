"use client";

import Link from "next/link";

/** Shown when a page fails on the server. The details stay in the server log. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : null;

  return (
    <main id="main" className="container-app py-[var(--space-2xl)]">
      <title>Something went wrong | LibraSearch</title>
      <div className="grid max-w-[60ch] gap-[var(--space-md)]">
        <p className="figure text-sm text-muted">Error</p>
        <h1 className="text-[length:var(--text-2xl)]">This page could not be loaded</h1>
        <p className="text-ink-2">
          Something failed on our side. Try again, and if it keeps happening, tell the library desk.
        </p>
        {digest ? (
          <p className="text-sm text-muted">
            Reference <span className="figure">{digest}</span>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-[var(--space-sm)]">
          <button type="button" className="btn btn-primary" onClick={() => retry()}>
            Try again
          </button>
          <Link href="/search" className="btn">
            Search the catalogue
          </Link>
        </div>
      </div>
    </main>
  );
}
