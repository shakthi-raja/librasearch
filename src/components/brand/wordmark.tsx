import Link from "next/link";

/** Three spines on a shelf, the third leaning: the mark beside the name. */
function Mark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="shrink-0">
      <rect x="3" y="4" width="4" height="16" rx="1" className="fill-ink" />
      <rect x="9" y="6" width="4" height="14" rx="1" className="fill-ink" />
      <rect
        x="15.5"
        y="5"
        width="4"
        height="15.5"
        rx="1"
        transform="rotate(14 17.5 20)"
        className="fill-accent"
      />
      <rect x="2" y="20.5" width="20" height="1.5" className="fill-ink" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link
      href="/"
      aria-label="LibraSearch home"
      className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] font-display text-lg font-semibold tracking-[-0.02em] text-ink no-underline"
    >
      <Mark />
      <span>LibraSearch</span>
    </Link>
  );
}
