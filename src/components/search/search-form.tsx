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
        <input
          id={`q-${size}`}
          name="q"
          type="search"
          required
          minLength={2}
          maxLength={200}
          defaultValue={defaultValue}
          placeholder="A topic, a title or an author"
          autoComplete="off"
          className={`input min-w-0 flex-1 ${size === "hero" ? "min-h-[var(--control-height-lg)]" : ""}`}
        />
        <button type="submit" className={`btn btn-primary ${size === "hero" ? "btn-lg" : ""}`}>
          Search
        </button>
      </form>
    </search>
  );
}
