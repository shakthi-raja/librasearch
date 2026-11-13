import Link from "next/link";

/** The body of every not-found page; the surrounding section supplies the header. */
export function NotFoundMessage() {
  return (
    <div className="grid max-w-[60ch] gap-[var(--space-md)]">
      <p className="figure text-sm text-muted">404</p>
      <h1 className="text-[length:var(--text-2xl)]">There is nothing on this shelf</h1>
      <p className="text-ink-2">
        The page you asked for does not exist. The link may be old, or a copy label may point to a
        book that has been withdrawn.
      </p>
      <div className="flex flex-wrap gap-[var(--space-sm)]">
        <Link href="/search" className="btn btn-primary">
          Search the catalogue
        </Link>
        <Link href="/" className="btn">
          Home
        </Link>
      </div>
    </div>
  );
}
