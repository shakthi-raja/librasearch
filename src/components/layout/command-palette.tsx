"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { paletteItems } from "@/lib/nav/palette";
import type { RoleName } from "@/server/repositories/auth";

export function CommandPalette({ role }: { role: RoleName }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const items = paletteItems(role, query);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      inputRef.current?.focus();
    }
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const go = (href: Route) => {
    setOpen(false);
    router.push(href);
  };

  // Keep Tab inside the dialog while it is open.
  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([tabindex="-1"]), input, a[href], select, textarea',
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const onInputKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => (value + 1) % Math.max(1, items.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => (value - 1 + items.length) % Math.max(1, items.length));
    } else if (event.key === "Enter" && items[active]) {
      event.preventDefault();
      go(items[active].href);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="btn hidden md:inline-flex"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
      >
        Jump to <kbd className="rounded border border-rule px-1 text-xs">⌘K</kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[var(--z-tooltip)] flex items-start justify-center p-4 pt-24">
          <button
            type="button"
            aria-label="Close the command palette"
            tabIndex={-1}
            className="absolute inset-0 bg-ink/40"
            onClick={close}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onKeyDown={trapFocus}
            className="relative w-[min(36rem,100%)] overflow-hidden rounded-[var(--radius-card)] border border-ink bg-paper-2 shadow-xl"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKey}
              placeholder="Jump to a page or search the catalogue"
              aria-label="Jump to a page or search the catalogue"
              aria-describedby="palette-hint"
              className="input w-full rounded-none border-0 border-b border-rule"
            />
            <div className="max-h-[50vh] overflow-y-auto py-1">
              {items.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">Nothing matches.</p>
              ) : (
                items.map((item, index) => (
                  <button
                    key={`${item.href}-${item.label}`}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(item.href)}
                    className={`flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left text-sm ${
                      index === active ? "bg-paper-3" : ""
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-muted">{item.hint}</span>
                  </button>
                ))
              )}
            </div>
            <p id="palette-hint" className="border-t border-rule px-4 py-2 text-xs text-muted">
              ↑↓ to move, Enter to open, Esc to close
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
