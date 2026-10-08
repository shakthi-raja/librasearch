"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NavItem } from "./nav";

const isActive = (pathname: string, item: NavItem, home: boolean) =>
  pathname === item.href || (!home && pathname.startsWith(`${item.href}/`));

/** Sections for the role. Grouped items fold into a menu each, so a long list still fits. */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<string | null>(null);

  // a route change closes any menu and keeps the current section in sight
  // biome-ignore lint/correctness/useExhaustiveDependencies: react to the route only
  useEffect(() => {
    setOpen(null);
    listRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !listRef.current?.contains(event.target as Node)
      ) {
        setOpen(null);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  // keep the order of first appearance: inline items and groups interleave
  const entries: (NavItem | { group: string; items: NavItem[] })[] = [];
  for (const item of items) {
    if (!item.group) {
      entries.push(item);
      continue;
    }
    const existing = entries.find(
      (entry): entry is { group: string; items: NavItem[] } =>
        "items" in entry && entry.group === item.group,
    );
    if (existing) existing.items.push(item);
    else entries.push({ group: item.group, items: [item] });
  }
  const home = items[0]?.href;

  return (
    <ul
      ref={listRef}
      className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] sm:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {entries.map((entry) => {
        if (!("items" in entry)) {
          const active = isActive(pathname, entry, entry.href === home);
          return (
            <li key={entry.href}>
              <Link
                href={entry.href}
                className="nav-link"
                aria-current={active ? "page" : undefined}
              >
                {entry.label}
              </Link>
            </li>
          );
        }
        const active = entry.items.some((item) => isActive(pathname, item, false));
        const id = `nav-${entry.group.toLowerCase()}`;
        return (
          <li key={entry.group} className="relative">
            <button
              type="button"
              className="nav-link gap-1"
              aria-expanded={open === entry.group}
              aria-controls={id}
              data-active={active ? "true" : undefined}
              onClick={() => setOpen((current) => (current === entry.group ? null : entry.group))}
            >
              {entry.group}
              <svg
                viewBox="0 0 10 10"
                width="8"
                height="8"
                aria-hidden="true"
                className="fill-current"
              >
                <path d="M1 3 L9 3 L5 8 Z" />
              </svg>
            </button>
            {open === entry.group ? (
              <ul
                id={id}
                className="fixed inset-x-[var(--gutter)] top-[var(--bar-height)] z-30 mt-1 grid sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:min-w-[13rem] rounded-[var(--radius-card)] border border-ink bg-paper-2 py-1 shadow-[var(--shadow-card)]"
              >
                {entry.items.map((item) => {
                  const current = isActive(pathname, item, false);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={current ? "page" : undefined}
                        className={`block px-[var(--space-sm)] py-1.5 text-sm hover:bg-paper-3 ${current ? "font-medium" : ""}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
