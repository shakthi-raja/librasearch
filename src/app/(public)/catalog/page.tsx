import type { Metadata } from "next";
import Link from "next/link";
import { Availability } from "@/components/catalog/availability";
import { CategoryTree } from "@/components/catalog/category-tree";
import { type Column, DataTable } from "@/components/data/data-table";
import { FilterBar } from "@/components/data/filter-bar";
import { Pagination } from "@/components/data/pagination";
import { first, hrefWith, listParams, pageInfo } from "@/lib/url/list-params";
import { pool } from "@/server/db/pool";
import {
  CATALOG_SORTS,
  type CatalogBook,
  categoryTree,
  listBooks,
} from "@/server/repositories/catalog";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Every book in the library by subject, with how many copies are on the shelf.",
};

const columns: Column<CatalogBook>[] = [
  {
    key: "title",
    header: "Title",
    sort: "title",
    primary: true,
    cell: (b) => (
      <div className="grid gap-0.5">
        <Link href={`/catalog/${b.bookId}`} className="font-medium text-ink">
          {b.title}
        </Link>
        <span className="text-muted">{b.authors}</span>
      </div>
    ),
  },
  {
    key: "subject",
    header: "Subject",
    cell: (b) => <span className="text-ink-2">{b.categoryName}</span>,
  },
  {
    key: "year",
    header: "Latest edition",
    sort: "year",
    align: "end",
    cell: (b) => (
      <span className="figure">
        {b.latestYear}
        {b.editionCount > 1 ? <span className="text-muted"> ({b.editionCount} eds)</span> : null}
      </span>
    ),
  },
  {
    key: "available",
    header: "On the shelf",
    sort: "available",
    cell: (b) => (
      <Availability
        available={b.availableCopies}
        total={b.totalCopies}
        reference={b.referenceCopies}
      />
    ),
  },
  {
    key: "rack",
    header: "Rack",
    cell: (b) => <span className="figure">{b.racks.join(", ")}</span>,
  },
];

export default async function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  const params = await searchParams;
  const list = listParams(params, { sorts: CATALOG_SORTS, defaultSort: "title" });
  const category = first(params, "category");
  const availableOnly = first(params, "available") === "1";

  const db = pool("student");
  const [tree, result] = await Promise.all([
    categoryTree(db),
    listBooks(db, {
      ...(category ? { categorySlug: category } : {}),
      availableOnly,
      sort: list.sort,
      dir: list.dir,
      limit: list.pageSize,
      offset: list.offset,
    }),
  ]);
  const heading = tree.find((n) => n.slug === category)?.name ?? "Catalogue";

  return (
    <div className="grid gap-[var(--space-xl)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-[calc(var(--bar-height)+var(--space-lg))] lg:self-start">
        <details className="lg:hidden" open={false}>
          <summary className="btn mb-[var(--space-sm)] cursor-pointer">Subjects</summary>
          <CategoryTree nodes={tree} current={category} params={params} />
        </details>
        <div className="hidden lg:block">
          <CategoryTree nodes={tree} current={category} params={params} />
        </div>
      </aside>

      <section aria-labelledby="catalog-heading" className="min-w-0">
        <div className="mb-[var(--space-lg)] grid gap-1">
          <h1 id="catalog-heading">{heading}</h1>
          <p className="text-muted">
            Browse by subject. Copies on the shelf are counted as you load the page.
          </p>
        </div>
        <FilterBar
          action="/catalog"
          label="Filter the catalogue"
          keep={{ category, sort: first(params, "sort"), dir: first(params, "dir") }}
          {...(availableOnly
            ? { clearHref: hrefWith("/catalog", params, { available: null }) }
            : {})}
        >
          <label className="flex min-h-[var(--control-height)] items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="available"
              value="1"
              defaultChecked={availableOnly}
              className="size-4 accent-accent"
            />
            On the shelf now
          </label>
        </FilterBar>
        <DataTable
          caption={`${heading}: books with their shelf state`}
          columns={columns}
          rows={result.rows}
          rowKey={(b) => b.bookId}
          pathname="/catalog"
          params={params}
          sort={{ key: list.sort, dir: list.dir }}
          empty={
            <div className="grid gap-1">
              <h2 className="text-lg">Nothing matches</h2>
              <p className="text-muted">
                {availableOnly
                  ? "Every copy in this subject is out. Clear the shelf filter to see all titles."
                  : "There are no books in this subject yet."}
              </p>
            </div>
          }
        />
        <Pagination
          info={pageInfo(list.page, list.pageSize, result.total)}
          noun="books"
          pathname="/catalog"
          params={params}
        />
      </section>
    </div>
  );
}
