import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { hrefWith, type SearchParams } from "@/lib/url/list-params";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Figures that compare align right in tabular numerals. */
  align?: "start" | "end";
  /** Sort key understood by the page; omit for unsortable columns. */
  sort?: string;
  /** Keep the column on a phone row; others collapse into the labelled list. */
  primary?: boolean;
  className?: string;
};

type Props<T> = {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  pathname: string;
  params: SearchParams;
  sort?: { key: string; dir: "asc" | "desc" };
  empty: ReactNode;
};

function SortLink({
  label,
  sortKey,
  active,
  dir,
  pathname,
  params,
}: {
  label: string;
  sortKey: string;
  active: boolean;
  dir: "asc" | "desc";
  pathname: string;
  params: SearchParams;
}) {
  const nextDir = active && dir === "asc" ? "desc" : "asc";
  return (
    <Link
      href={hrefWith(pathname, params, { sort: sortKey, dir: nextDir }) as Route}
      className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] no-underline hover:text-ink"
    >
      {label}
      <svg
        viewBox="0 0 10 10"
        width="9"
        height="9"
        aria-hidden="true"
        className={active ? "fill-ink" : "fill-rule-strong"}
      >
        {active && dir === "desc" ? <path d="M1 3 L9 3 L5 8 Z" /> : <path d="M1 7 L9 7 L5 2 Z" />}
      </svg>
    </Link>
  );
}

/**
 * A ruled, server-rendered table. Sorting is a link, so state lives in the
 * URL and the page works without scripts. Under 40rem each row becomes a
 * labelled block.
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  pathname,
  params,
  sort,
  empty,
}: Props<T>) {
  if (rows.length === 0) return <div className="ruled py-[var(--space-lg)]">{empty}</div>;

  return (
    <table className="data-table w-full border-collapse text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-ink">
          {columns.map((column) => {
            const active = sort?.key === column.sort;
            return (
              <th
                key={column.key}
                scope="col"
                aria-sort={active ? (sort?.dir === "asc" ? "ascending" : "descending") : undefined}
                className={`whitespace-nowrap py-[var(--space-xs)] pr-[var(--space-md)] text-left text-xs font-medium text-muted last:pr-0 ${
                  column.align === "end" ? "text-right" : ""
                }`}
              >
                {column.sort ? (
                  <SortLink
                    label={column.header}
                    sortKey={column.sort}
                    active={active}
                    dir={sort?.dir ?? "asc"}
                    pathname={pathname}
                    params={params}
                  />
                ) : (
                  column.header
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)} className="border-b border-rule">
            {columns.map((column) => (
              <td
                key={column.key}
                data-label={column.header}
                data-primary={column.primary ? "" : undefined}
                className={`py-[var(--space-sm)] pr-[var(--space-md)] align-top last:pr-0 ${
                  column.align === "end" ? "text-right tabular-nums" : ""
                } ${column.className ?? ""}`}
              >
                {column.cell(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
