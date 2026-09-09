import { Field } from "@/components/forms/action-form";

type Book = {
  title: string;
  subtitle: string | null;
  categoryId: number;
  description: string;
  authors: string[];
};

export function BookFields({
  book,
  categories,
}: {
  book?: Book;
  categories: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-[var(--space-sm)] md:grid-cols-2">
      <Field label="Title">
        <input name="title" required maxLength={200} defaultValue={book?.title} className="input" />
      </Field>
      <Field label="Subtitle">
        <input
          name="subtitle"
          maxLength={200}
          defaultValue={book?.subtitle ?? ""}
          className="input"
        />
      </Field>
      <Field label="Subject">
        <select
          name="categoryId"
          required
          defaultValue={book ? String(book.categoryId) : ""}
          className="select"
        >
          <option value="" disabled>
            Choose a subject
          </option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Authors, in order, separated by commas">
        <input name="authors" required defaultValue={book?.authors.join(", ")} className="input" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Description">
          <textarea
            name="description"
            required
            minLength={20}
            rows={4}
            defaultValue={book?.description}
            className="input py-[var(--space-xs)]"
          />
        </Field>
      </div>
    </div>
  );
}
