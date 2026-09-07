import { z } from "zod";

export type SearchParams = Record<string, string | string[] | undefined>;

export const MAX_PAGE_SIZE = 100;

/** First value of a query parameter, trimmed, or undefined when absent or blank. */
export function first(params: SearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value ? value : undefined;
}

const pageSchema = z.coerce.number().int().min(1).max(10_000).catch(1);

export type ListParams<S extends string> = {
  page: number;
  pageSize: number;
  sort: S;
  dir: "asc" | "desc";
  offset: number;
};

/**
 * Page, size and sort from the URL. Anything malformed falls back to the
 * default instead of failing, so a hand-edited link never breaks a page.
 */
export function listParams<S extends string>(
  params: SearchParams,
  options: { sorts: readonly S[]; defaultSort: S; defaultDir?: "asc" | "desc"; pageSize?: number },
): ListParams<S> {
  const page = pageSchema.parse(first(params, "page"));
  const sizeDefault = options.pageSize ?? 20;
  const pageSize = z.coerce
    .number()
    .int()
    .min(5)
    .max(MAX_PAGE_SIZE)
    .catch(sizeDefault)
    .parse(first(params, "size"));
  const sortRaw = first(params, "sort");
  const sort = (options.sorts as readonly string[]).includes(sortRaw ?? "")
    ? (sortRaw as S)
    : options.defaultSort;
  const dirRaw = first(params, "dir");
  const dir = dirRaw === "asc" || dirRaw === "desc" ? dirRaw : (options.defaultDir ?? "asc");
  return { page, pageSize, sort, dir, offset: (page - 1) * pageSize };
}

/**
 * Builds a link to the same list with some parameters changed. A null or
 * empty value removes the parameter; any change other than the page itself
 * returns to page one.
 */
export function hrefWith(
  pathname: string,
  params: SearchParams,
  changes: Record<string, string | number | null>,
) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) next.set(key, v);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, String(value));
  }
  if (!("page" in changes)) next.delete("page");
  if (next.get("page") === "1") next.delete("page");
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export type PageInfo = {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  from: number;
  to: number;
};

export function pageInfo(page: number, pageSize: number, total: number): PageInfo {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return { page, pageSize, total, pages, from, to };
}
