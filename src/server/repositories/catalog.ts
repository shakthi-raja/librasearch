import "server-only";
import type { Pool, RowDataPacket } from "mysql2/promise";

export type CategoryNode = {
  categoryId: number;
  parentId: number | null;
  name: string;
  slug: string;
  /** Active books in this category and every category below it. */
  bookCount: number;
};

export type CatalogBook = {
  bookId: number;
  title: string;
  subtitle: string | null;
  authors: string;
  categoryName: string;
  categoryPath: string;
  latestYear: number | null;
  editionCount: number;
  totalCopies: number;
  availableCopies: number;
  referenceCopies: number;
  racks: string[];
};

export const CATALOG_SORTS = ["title", "year", "available"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

const ORDER: Record<CatalogSort, string> = {
  title: "p.title",
  year: "p.latest_year",
  available: "p.available_copies",
};

export type CatalogQuery = {
  categorySlug?: string;
  availableOnly: boolean;
  sort: CatalogSort;
  dir: "asc" | "desc";
  limit: number;
  offset: number;
};

/**
 * The tree with subtree counts. A recursive CTE pairs every category with
 * all of its ancestors, so a book counts towards each level above it.
 */
export async function categoryTree(db: Pool): Promise<CategoryNode[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `WITH RECURSIVE lineage (category_id, ancestor_id) AS (
       SELECT category_id, category_id FROM categories
       UNION ALL
       SELECT l.category_id, c.parent_id
         FROM lineage l
         JOIN categories c ON c.category_id = l.ancestor_id
        WHERE c.parent_id IS NOT NULL
     )
     SELECT c.category_id, c.parent_id, c.name, c.slug, COUNT(b.book_id) AS book_count
       FROM categories c
       LEFT JOIN lineage l ON l.ancestor_id = c.category_id
       LEFT JOIN books b ON b.category_id = l.category_id AND b.status = 'ACTIVE'
      GROUP BY c.category_id, c.parent_id, c.name, c.slug
      ORDER BY c.name`,
  );
  return rows.map((r) => ({
    categoryId: Number(r.category_id),
    parentId: r.parent_id === null ? null : Number(r.parent_id),
    name: String(r.name),
    slug: String(r.slug),
    bookCount: Number(r.book_count),
  }));
}

function toBook(r: RowDataPacket): CatalogBook {
  return {
    bookId: Number(r.book_id),
    title: String(r.title),
    subtitle: r.subtitle === null ? null : String(r.subtitle),
    authors: String(r.authors ?? ""),
    categoryName: String(r.category_name),
    categoryPath: String(r.category_path),
    latestYear: r.latest_year === null ? null : Number(r.latest_year),
    editionCount: Number(r.edition_count),
    totalCopies: Number(r.total_copies),
    availableCopies: Number(r.available_copies),
    referenceCopies: Number(r.reference_copies),
    racks: r.racks ? String(r.racks).split(",") : [],
  };
}

/** One page of the public catalogue and the total that matches, browsing a whole subtree. */
export async function listBooks(
  db: Pool,
  q: CatalogQuery,
): Promise<{ rows: CatalogBook[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  let cte = "";

  if (q.categorySlug) {
    cte = `WITH RECURSIVE subtree (category_id) AS (
             SELECT category_id FROM categories WHERE slug = ?
             UNION ALL
             SELECT c.category_id FROM categories c JOIN subtree s ON c.parent_id = s.category_id
           )`;
    params.push(q.categorySlug);
    where.push("p.category_id IN (SELECT category_id FROM subtree)");
  }
  if (q.availableOnly) where.push("p.available_copies > 0");
  const filter = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  // the sort column comes from a fixed map, never from the request
  const order = `${ORDER[q.sort]} ${q.dir === "desc" ? "DESC" : "ASC"}, p.title ASC, p.book_id ASC`;

  const [rows] = await db.query<RowDataPacket[]>(
    `${cte}
     SELECT p.book_id, p.title, p.subtitle, p.authors, p.category_name, p.category_path,
            p.latest_year, p.edition_count, p.total_copies, p.available_copies,
            p.reference_copies, p.racks
       FROM v_catalog_public p
       ${filter}
      ORDER BY ${order}
      LIMIT ? OFFSET ?`,
    [...params, q.limit, q.offset],
  );
  const [count] = await db.query<RowDataPacket[]>(
    `${cte} SELECT COUNT(*) AS total FROM v_catalog_public p ${filter}`,
    params,
  );
  return { rows: rows.map(toBook), total: Number(count[0]?.total ?? 0) };
}
