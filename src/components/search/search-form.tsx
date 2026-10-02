import { SearchCombobox } from "./search-combobox";

export function SearchForm({
  defaultValue,
  size = "page",
}: {
  defaultValue?: string;
  size?: "page" | "hero";
}) {
  return (
    <search>
      <form
        action="/search"
        method="get"
        className="flex w-full max-w-[40rem] gap-[var(--space-xs)]"
      >
        <label htmlFor={`q-${size}`} className="sr-only">
          Search the library
        </label>
        <SearchCombobox
          id={`q-${size}`}
          name="q"
          required
          defaultValue={defaultValue}
          placeholder="A topic, a title, a course code or cn, dbms, daa"
          className={`input ${size === "hero" ? "min-h-[var(--control-height-lg)]" : ""}`}
        />
        <button type="submit" className={`btn btn-primary ${size === "hero" ? "btn-lg" : ""}`}>
          Search
        </button>
      </form>
    </search>
  );
}
