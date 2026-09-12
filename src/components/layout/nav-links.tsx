"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { NavItem } from "./nav";

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);

  // On a narrow header the sections scroll sideways; keep the current one in
  // sight instead of leaving it off-screen behind the wordmark.
  // The route change is what moves the current item, even though the body only
  // reads the rendered DOM.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when the route changes
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <ul
      ref={listRef}
      className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
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
