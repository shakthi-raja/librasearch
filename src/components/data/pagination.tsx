import type { Route } from "next";
import Link from "next/link";
import { hrefWith, type PageInfo, type SearchParams } from "@/lib/url/list-params";

type Props = { info: PageInfo; noun: string; pathname: string; params: SearchParams };

export function Pagination({ info, noun, pathname, params }: Props) {
  const prev = info.page > 1 ? hrefWith(pathname, params, { page: info.page - 1 }) : null;
  const next = info.page < info.pages ? hrefWith(pathname, params, { page: info.page + 1 }) : null;

  return (
    <nav
      aria-label="Pages"
      className="mt-[var(--space-md)] flex flex-wrap items-center justify-between gap-[var(--space-sm)] text-sm text-muted"
    >
      <p>
        {info.total === 0 ? (
          `No ${noun}`
        ) : (
          <>
            <span className="tabular-nums text-ink">
              {info.from} to {info.to}
            </span>{" "}
            of <span className="tabular-nums text-ink">{info.total}</span> {noun}
          </>
        )}
      </p>
      {info.pages > 1 ? (
        <div className="flex items-center gap-2">
          {prev ? (
            <Link href={prev as Route} className="btn" rel="prev">
              Previous
            </Link>
          ) : (
            <span className="btn" aria-disabled="true">
              Previous
            </span>
          )}
          <span className="tabular-nums">
            Page {info.page} of {info.pages}
          </span>
          {next ? (
            <Link href={next as Route} className="btn" rel="next">
              Next
            </Link>
          ) : (
            <span className="btn" aria-disabled="true">
              Next
            </span>
          )}
        </div>
      ) : null}
    </nav>
  );
}
