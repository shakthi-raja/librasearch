"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./nav";

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex min-w-0 items-center gap-1 overflow-x-auto">
      {items.map((item, index) => {
        // the first item is the role's home, which every other page sits under
        const active =
          pathname === item.href || (index > 0 && pathname.startsWith(`${item.href}/`));
        return (
          <li key={item.href}>
            <Link href={item.href} className="nav-link" aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
