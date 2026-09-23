import type { Route } from "next";
import { NAV } from "@/components/layout/nav";
import type { RoleName } from "@/server/repositories/auth";

export type PaletteItem = { label: string; href: Route; hint: string };

const SEARCH: PaletteItem = {
  label: "Search the catalogue",
  href: "/search",
  hint: "Books and chapters",
};

const EXTRA: Record<RoleName, PaletteItem[]> = {
  STUDENT: [SEARCH, { label: "Your loans", href: "/student", hint: "Due dates and renewals" }],
  FACULTY: [
    SEARCH,
    { label: "Syllabus units", href: "/faculty/units", hint: "Map chapters to units" },
    { label: "Coverage", href: "/faculty/coverage", hint: "How much of the syllabus is mapped" },
  ],
  LIBRARIAN: [
    SEARCH,
    { label: "Issue a copy", href: "/admin/circulation", hint: "The desk" },
    { label: "Demand planner", href: "/admin/demand", hint: "Shortages before exams" },
  ],
};

/**
 * The palette's list for a role. A query filters labels and hints; when it
 * matches no page, the catalogue search becomes the last entry.
 */
export function paletteItems(role: RoleName, query: string): PaletteItem[] {
  const seen = new Set<string>();
  const pages: PaletteItem[] = NAV[role].map((item) => ({ ...item, hint: "Page" }));
  const all = [...pages, ...EXTRA[role]].filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });

  const text = query.trim().toLowerCase();
  if (!text) return all.slice(0, 9);

  const matches = all.filter(
    (item) =>
      item.label.toLowerCase().includes(text) ||
      ("hint" in item && String(item.hint).toLowerCase().includes(text)),
  );
  const items = matches.slice(0, 8);
  items.push({
    label: `Search the catalogue for “${query.trim()}”`,
    href: `/search?q=${encodeURIComponent(query.trim())}` as Route,
    hint: "Catalogue",
  });
  return items.slice(0, 9);
}
