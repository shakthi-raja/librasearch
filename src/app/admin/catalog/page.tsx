import type { Metadata } from "next";
import Link from "next/link";
import { type Column, DataTable } from "@/components/data/data-table";
import { FilterBar, FilterText } from "@/components/data/filter-bar";
import { Pagination } from "@/components/data/pagination";
import { PageHeader } from "@/components/layout/app-shell";
import { first, listParams, pageInfo } from "@/lib/url/list-params";
import { pool } from "@/server/db/pool";
import { type AdminBookRow, listBooksAdmin } from "@/server/repositories/admin-catalog";

export const metadata: Metadata = { title: "Catalogue" };

const columns: Column<AdminBookRow>[] = [
  {
    key: "title",
    header: "Title",
    primary: true,
    cell: (b) => (
      <Link href={`/admin/catalog/${b.bookId}`} className="font-medium">
        {b.title}
      </Link>
    ),
  },
  {
    key: "subject",
    header: "Subject",
    cell: (b) => <span className="text-muted">{b.categoryPath}</span>,
  },
  { key: "editions", header: "Editions", align: "end", cell: (b) => b.editions },
  { key: "copies", header: "Copies", align: "end", cell: (b) => b.copies },
  {
    key: "status",
    header: "Status",
    cell: (b) => (
      <span className={b.status === "ACTIVE" ? "chip chip-in-date" : "chip"}>
        {b.status === "ACTIVE" ? "In the catalogue" : "Withdrawn"}
      </span>
    ),
  },
];

export default async function AdminCatalogPage({ searchParams }: PageProps<"/admin/catalog">) {
  const params = await searchParams;
  const list = listParams(params, {
    sorts: ["title"] as const,
    defaultSort: "title",
    pageSize: 25,
  });
  const q = first(params, "q");
  const { rows, total } = await listBooksAdmin(pool("librarian"), q, list.pageSize, list.offset);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-md)]">
        <PageHeader
          title="Catalogue"
          description="Books, their editions and every copy on the racks."
        />
        <Link href="/admin/catalog/new" className="btn btn-primary">
          Add a book
        </Link>
      </div>
      <FilterBar
        action="/admin/catalog"
        label="Find a book"
        {...(q ? { clearHref: "/admin/catalog" } : {})}
      >
        <FilterText name="q" label="Title" value={q} placeholder="Part of a title" />
      </FilterBar>
      <DataTable
        caption="Books in the catalogue"
        columns={columns}
        rows={rows}
        rowKey={(b) => b.bookId}
        pathname="/admin/catalog"
        params={params}
        empty={
          <p className="text-muted">
            {q ? "No title contains that text." : "No books yet. Add the first one."}
          </p>
        }
      />
      <Pagination
        info={pageInfo(list.page, list.pageSize, total)}
        noun="books"
        pathname="/admin/catalog"
        params={params}
      />
    </>
  );
}
