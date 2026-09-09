import type { Route } from "next";
import Link from "next/link";
import { hrefWith, type SearchParams } from "@/lib/url/list-params";
import type { CategoryNode } from "@/server/repositories/catalog";

type Props = { nodes: CategoryNode[]; current: string | undefined; params: SearchParams };

function Branch({
  nodes,
  parentId,
  current,
  params,
  depth,
}: Props & { parentId: number | null; depth: number }) {
  const children = nodes.filter((n) => n.parentId === parentId && n.bookCount > 0);
  if (children.length === 0) return null;
  return (
    <ul
      className={
        depth === 0
          ? "grid gap-0.5"
          : "mt-0.5 grid gap-0.5 border-l border-rule pl-[var(--space-sm)]"
      }
    >
      {children.map((node) => (
        <li key={node.categoryId}>
          <Link
            href={hrefWith("/catalog", params, { category: node.slug }) as Route}
            aria-current={node.slug === current ? "page" : undefined}
            className="nav-link w-full justify-between gap-2 px-[var(--space-xs)] text-sm"
          >
            <span className="min-w-0 truncate">{node.name}</span>
            <span className="tabular-nums text-xs">{node.bookCount}</span>
          </Link>
          <Branch
            nodes={nodes}
            parentId={node.categoryId}
            current={current}
            params={params}
            depth={depth + 1}
          />
        </li>
      ))}
    </ul>
  );
}

/** Subjects as a tree with how many books sit under each. */
export function CategoryTree({ nodes, current, params }: Props) {
  return (
    <nav aria-label="Subjects">
      <Link
        href={hrefWith("/catalog", params, { category: null }) as Route}
        aria-current={current ? undefined : "page"}
        className="nav-link mb-0.5 w-full px-[var(--space-xs)] text-sm"
      >
        All subjects
      </Link>
      <Branch nodes={nodes} parentId={null} current={current} params={params} depth={0} />
    </nav>
  );
}
