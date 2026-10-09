import type { Route } from "next";
import type { RoleName } from "@/server/repositories/auth";

export type NavItem = { href: Route; label: string; group?: string };

/** Destinations per role. Items join as their screens land. */
export const NAV: Record<RoleName, NavItem[]> = {
  STUDENT: [
    { href: "/student", label: "Overview" },
    { href: "/student/card", label: "Card" },
    { href: "/notices", label: "Notices" },
    { href: "/account", label: "Account" },
  ],
  FACULTY: [
    { href: "/faculty", label: "Overview" },
    { href: "/faculty/units", label: "Units" },
    { href: "/faculty/coverage", label: "Coverage" },
    { href: "/notices", label: "Notices" },
    { href: "/student", label: "Borrowing" },
    { href: "/student/card", label: "Card" },
    { href: "/account", label: "Account" },
  ],
  LIBRARIAN: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/circulation", label: "Circulation desk", group: "Desk" },
    { href: "/admin/holds", label: "Holds", group: "Desk" },
    { href: "/admin/fines", label: "Fines", group: "Desk" },
    { href: "/kiosk", label: "Self-checkout kiosk", group: "Desk" },
    { href: "/admin/stocktake", label: "Stocktake", group: "Desk" },
    { href: "/admin/catalog", label: "Catalogue", group: "Collection" },
    { href: "/admin/import", label: "Import", group: "Collection" },
    { href: "/admin/procurement", label: "Procurement", group: "Collection" },
    { href: "/admin/academic", label: "Academic", group: "Planning" },
    { href: "/admin/demand", label: "Demand", group: "Planning" },
    { href: "/admin/exams", label: "Exams", group: "Planning" },
    { href: "/admin/analytics", label: "Analytics", group: "Planning" },
    { href: "/admin/notices", label: "Notices", group: "System" },
    { href: "/admin/search", label: "Search", group: "System" },
    { href: "/admin/vector", label: "Vector index", group: "System" },
    { href: "/admin/audit", label: "Audit log", group: "System" },
    { href: "/admin/settings", label: "Settings", group: "System" },
    { href: "/account", label: "Account" },
  ],
};

export const ROLE_LABEL: Record<RoleName, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  LIBRARIAN: "Librarian",
};
