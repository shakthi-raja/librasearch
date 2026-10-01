import type { RowDataPacket } from "mysql2/promise";
import type { Metadata } from "next";
import Link from "next/link";
import { BookCover } from "@/components/catalog/book-cover";
import { pool } from "@/server/db/pool";

export const metadata: Metadata = {
  title: "Open shelf",
  description: "Books on the syllabus that their authors publish free to read online.",
};

type Row = {
  bookId: number;
  title: string;
  authors: string;
  coverUrl: string | null;
  url: string;
  kind: string;
  provider: string;
  licence: string | null;
  category: string;
};

export default async function OpenShelfPage() {
  const [rows] = await pool("student").query<RowDataPacket[]>(
    `SELECT book_id, title, authors, cover_url, url, kind, provider, licence, category_name
       FROM v_open_shelf ORDER BY category_name, title`,
  );
  const shelf: Row[] = rows.map((row) => ({
    bookId: Number(row.book_id),
    title: String(row.title),
    authors: String(row.authors ?? ""),
    coverUrl: row.cover_url === null ? null : String(row.cover_url),
    url: String(row.url),
    kind: String(row.kind),
    provider: String(row.provider),
    licence: row.licence === null ? null : String(row.licence),
    category: String(row.category_name),
  }));
  const groups = new Map<string, Row[]>();
  for (const row of shelf) groups.set(row.category, [...(groups.get(row.category) ?? []), row]);

  return (
    <div className="grid gap-[var(--space-2xl)]">
      <header className="grid max-w-[62rem] gap-[var(--space-md)]">
        <p className="text-sm text-muted">Discovery</p>
        <h1 className="text-[length:var(--text-4xl)]">Open shelf</h1>
        <p className="max-w-[60ch] text-ink-2">
          Books on the syllabus that their authors publish free to read online. Every link goes to
          the authors' own copy; the printed books stay on the racks to borrow as usual.
        </p>
      </header>

      {shelf.length === 0 ? (
        <p className="text-muted">Nothing on the open shelf yet.</p>
      ) : (
        [...groups].map(([category, books]) => (
          <section key={category} aria-label={category} className="grid gap-[var(--space-sm)]">
            <h2 className="text-lg">{category}</h2>
            <ul className="grid gap-[var(--space-md)] sm:grid-cols-2 xl:grid-cols-3">
              {books.map((book) => (
                <li
                  key={book.url}
                  className="flex gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-rule p-[var(--space-sm)]"
                >
                  <BookCover src={book.coverUrl} title={book.title} size="md" />
                  <div className="grid content-start gap-1">
                    <Link
                      href={`/catalog/${book.bookId}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {book.title}
                    </Link>
                    <p className="text-xs text-muted">{book.authors}</p>
                    <p className="text-xs text-muted">
                      {book.kind === "CHAPTERS" ? "Free chapters" : "Full text"} from{" "}
                      {book.provider}
                      {book.licence ? `, ${book.licence}` : ""}
                    </p>
                    <a
                      href={book.url}
                      rel="noopener"
                      className="mt-1 text-sm font-medium underline underline-offset-4"
                    >
                      Read online
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
