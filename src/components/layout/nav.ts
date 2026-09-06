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
    { href: "/account", label: "Account" },
  ],
  LIBRARIAN: [
    { href: "/admin", label: "Overview" },
    { href: "/account", label: "Account" },
  ],
};

export const ROLE_LABEL: Record<RoleName, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  LIBRARIAN: "Librarian",
};
