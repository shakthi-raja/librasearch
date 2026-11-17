"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { NavItem } from "./nav";

const isActive = (pathname: string, href: string, home: boolean) =>
  pathname === href || (!home && pathname.startsWith(`${href}/`));

/**
 * The top bar's sections on narrow screens: one Menu button that opens the
 * whole list under the bar, grouped the same way as the wide-screen menus.
 * `header` and `footer` carry who is signed in and the sign-out form.
 */
export function MobileMenu({
  items,
  label,
  header,
  footer,
  className = "",
}: {
  items: NavItem[];
  label: string;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // a new page closes the menu
  // biome-ignore lint/correctness/useExhaustiveDependencies: react to the route only
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    rootRef.current
      ?.querySelector<HTMLElement>("[data-menu-panel] a, [data-menu-panel] button")
      ?.focus();
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") {
          setOpen(false);
          rootRef.current?.querySelector<HTMLElement>("[data-menu-toggle]")?.focus();
        }
        return;
      }
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  // inline items first appear where they are listed; grouped items gather under their group
  const sections: { group: string | null; items: NavItem[] }[] = [];
  for (const item of items) {
    const group = item.group ?? null;
    const last = sections[sections.length - 1];
    const existing = group ? sections.find((section) => section.group === group) : undefined;
    if (existing) existing.items.push(item);
    else if (!group && last && last.group === null) last.items.push(item);
    else sections.push({ group, items: [item] });
  }
  const home = items[0]?.href;

  return (
    <div ref={rootRef} className={className}>
      <button
        type="button"
        className="btn"
        data-menu-toggle
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="fill-current">
          {open ? (
            <path d="M3.5 2.4 8 6.9l4.5-4.5 1.1 1.1L9.1 8l4.5 4.5-1.1 1.1L8 9.1l-4.5 4.5-1.1-1.1L6.9 8 2.4 3.5z" />
          ) : (
            <path d="M2 3.25h12v1.5H2zm0 4h12v1.5H2zm0 4h12v1.5H2z" />
          )}
        </svg>
        Menu
      </button>
      {open ? (
        <nav
          id={panelId}
          aria-label={label}
          data-menu-panel
          className="fixed inset-x-0 top-[var(--bar-height)] z-[var(--z-dropdown)] max-h-[calc(100dvh-var(--bar-height))] overflow-y-auto border-b border-ink bg-paper-2 shadow-[var(--shadow-card)]"
        >
          <div className="container-app grid gap-[var(--space-md)] py-[var(--space-md)]">
            {header}
            {sections.map((section) => (
              <div key={section.group ?? section.items[0]?.href} className="grid gap-1">
                {section.group ? (
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">
                    {section.group}
                  </p>
                ) : null}
                <ul className="grid">
                  {section.items.map((item) => {
                    const current = isActive(pathname, item.href, item.href === home);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={current ? "page" : undefined}
                          className={`flex min-h-11 items-center rounded-[var(--radius-pill)] px-2 text-base hover:bg-paper-3 ${current ? "bg-paper-3 font-medium" : ""}`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {footer}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
