import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  action: string;
  /** Hidden fields to carry across a filter change, such as the sort. */
  keep?: Record<string, string | undefined>;
  children: ReactNode;
  clearHref?: string;
  label: string;
};

/**
 * A plain GET form: filters become query parameters, the server renders the
 * result, and the browser's back button undoes a filter.
 */
export function FilterBar({ action, keep = {}, children, clearHref, label }: Props) {
  return (
    <search aria-label={label} className="mb-[var(--space-lg)] block">
      <form action={action} method="get" className="flex flex-wrap items-end gap-[var(--space-sm)]">
        {Object.entries(keep).map(([name, value]) =>
          value ? <input key={name} type="hidden" name={name} value={value} /> : null,
        )}
        {children}
        <button type="submit" className="btn">
          Apply
        </button>
        {clearHref ? (
          <Link href={clearHref as Route} className="btn btn-quiet">
            Clear
          </Link>
        ) : null}
      </form>
    </search>
  );
}

export function FilterSelect({
  name,
  label,
  value,
  options,
  allLabel,
}: {
  name: string;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted">
      {label}
      <select name={name} defaultValue={value ?? ""} className="select">
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterText({
  name,
  label,
  value,
  placeholder,
}: {
  name: string;
  label: string;
  value: string | undefined;
  placeholder?: string;
}) {
  return (
    <label className="grid min-w-[14rem] flex-1 gap-1 text-xs font-medium text-muted">
      {label}
      <input
        type="search"
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        className="input"
      />
    </label>
  );
}
