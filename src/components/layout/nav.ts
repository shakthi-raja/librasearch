import type { Route } from "next";
import type { RoleName } from "@/server/repositories/auth";

export type NavItem = { href: Route; label: string };

/** Destinations per role. Items join as their screens land. */
export const NAV: Record<RoleName, NavItem[]> = {
  STUDENT: [
    { href: "/student", label: "Overview" },
    { href: "/account", label: "Account" },
  ],
  FACULTY: [
    { href: "/faculty", label: "Overview" },
    { href: "/faculty/units", label: "Units" },
    { href: "/faculty/coverage", label: "Coverage" },
    { href: "/student", label: "Borrowing" },
    { href: "/account", label: "Account" },
  ],
  LIBRARIAN: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/circulation", label: "Circulation" },
    { href: "/admin/holds", label: "Holds" },
    { href: "/admin/fines", label: "Fines" },
    { href: "/admin/academic", label: "Academic" },
    { href: "/admin/demand", label: "Demand" },
    { href: "/admin/exams", label: "Exams" },
    { href: "/admin/procurement", label: "Procurement" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/audit", label: "Audit" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/vector", label: "Vector" },
    { href: "/admin/catalog", label: "Catalogue" },
    { href: "/account", label: "Account" },
  ],
};

export const ROLE_LABEL: Record<RoleName, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  LIBRARIAN: "Librarian",
};
