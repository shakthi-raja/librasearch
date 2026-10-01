"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type Suggestion = {
  text: string;
  kind: "trending" | "alias" | "course" | "book";
  hint: string | null;
  href: string | null;
};

type Props = {
  id: string;
  name: string;
  defaultValue?: string | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  required?: boolean | undefined;
};

/**
 * A search box that offers completions as you type: trending queries,
 * abbreviations, courses and books. It is a plain input inside a GET form, so
 * without JavaScript it still searches.
 */
export function SearchCombobox({
  id,
  name,
  defaultValue,
  placeholder,
  className,
  required,
}: Props) {
  const router = useRouter();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setItems([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/v1/search/suggest?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const body = (await response.json()) as { suggestions: Suggestion[] };
        setItems(body.suggestions);
        setActive(-1);
      } catch {
        // a dropped suggestion request is not worth telling anyone about
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  const choose = (item: Suggestion) => {
    setOpen(false);
    if (item.href) {
      router.push(item.href as Route);
      return;
    }
    setValue(item.text);
    if (input.current) input.current.value = item.text;
    input.current?.form?.requestSubmit();
  };

  const showing = open && items.length > 0;

  return (
    <div className="relative min-w-0 flex-1">
      <input
        ref={input}
        id={id}
        name={name}
        type="search"
        role="combobox"
        aria-expanded={showing}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showing && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        required={required}
        minLength={2}
        maxLength={200}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (!showing) {
            if (event.key === "ArrowDown" && items.length > 0) setOpen(true);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => (index + 1) % items.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => (index <= 0 ? items.length - 1 : index - 1));
          } else if (event.key === "Enter" && active >= 0) {
            const item = items[active];
            if (item) {
              event.preventDefault();
              choose(item);
            }
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`${className ?? "input"} w-full`}
      />
      {showing ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="absolute inset-x-0 top-full z-20 mt-1 grid overflow-hidden rounded-[var(--radius-card)] border border-ink bg-paper-2 py-1 shadow-[var(--shadow-card)]"
        >
          {items.map((item, index) => (
            <div
              key={`${item.kind}-${item.text}`}
              id={`${listId}-${index}`}
              role="option"
              tabIndex={-1}
              aria-selected={index === active}
              // mousedown keeps focus in the input until the choice is made
              onMouseDown={(event) => {
                event.preventDefault();
                choose(item);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-baseline justify-between gap-[var(--space-md)] px-[var(--space-sm)] py-1.5 text-sm ${
                index === active ? "bg-paper-3" : ""
              }`}
            >
              <span className="truncate">{item.text}</span>
              {item.hint ? <span className="shrink-0 text-xs text-muted">{item.hint}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
