"use client";

import "./globals.css";

/** Last resort when the root layout itself fails; it renders its own document. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en-IN">
      <body>
        <title>Something went wrong | LibraSearch</title>
        <main className="container-app py-[var(--space-2xl)]">
          <div className="grid max-w-[60ch] gap-[var(--space-md)]">
            <h1 className="text-[length:var(--text-2xl)]">LibraSearch is not available</h1>
            <p className="text-ink-2">
              The library system could not start this page. Try again in a moment.
            </p>
            <div className="flex flex-wrap gap-[var(--space-sm)]">
              <button type="button" className="btn btn-primary" onClick={() => retry()}>
                Try again
              </button>
              {/* a plain link: the router may be the part that failed */}
              <a href="/" className="btn">
                Home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
