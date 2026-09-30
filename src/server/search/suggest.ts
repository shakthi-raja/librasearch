import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db/pool";
import { aliasMap } from "./aliases";
import { cached, catalogueVersion, digest } from "./cache";
import { trendingSearches } from "./trending";

export type Suggestion = {
  text: string;
  kind: "trending" | "alias" | "course" | "book";
  hint: string | null;
  href: string | null;
};

const like = (prefix: string) => `${prefix.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/**
 * What to offer while someone types: queries others found useful this week,
 * courses, abbreviations and book titles, in that order. Cached per prefix and catalogue
 * version for five minutes.
 */
export async function suggestions(input: string, limit = 8): Promise<Suggestion[]> {
  const prefix = input.trim().toLowerCase().slice(0, 40);
  if (prefix.length < 2) return [];
  const version = await catalogueVersion();
  const key = version === null ? null : `search:suggest:v2:${version}:${digest(prefix)}`;

  return cached(key, 300, async () => {
    const db = pool("student");
    const [trending, aliases, [courses], [books]] = await Promise.all([
      trendingSearches(20),
      aliasMap().catch(() => new Map<string, string>()),
      db.query<RowDataPacket[]>(
        `SELECT course_code, title FROM courses
          WHERE course_code LIKE ? OR title LIKE ? OR title LIKE ?
          ORDER BY semester, course_code LIMIT 4`,
        [like(prefix.toUpperCase()), like(prefix), `% ${like(prefix)}`],
      ),
      db.query<RowDataPacket[]>(
        `SELECT book_id, title FROM books
          WHERE status = 'ACTIVE' AND (title LIKE ? OR title LIKE ?)
          ORDER BY title LIMIT 5`,
        [like(prefix), `% ${like(prefix)}`],
      ),
    ]);

    const all: Suggestion[] = [
      ...trending
        .filter((t) => t.query.startsWith(prefix))
        .map((t) => ({
          text: t.query,
          kind: "trending" as const,
          hint: "Searched this week",
          href: null,
        })),
      ...courses.map((row) => ({
        text: String(row.title),
        kind: "course" as const,
        hint: String(row.course_code),
        href: `/search?q=${encodeURIComponent(String(row.course_code))}`,
      })),
      ...[...aliases]
        .filter(([alias, expansion]) => alias.startsWith(prefix) || expansion.startsWith(prefix))
        .map(([alias, expansion]) => ({
          text: expansion,
          kind: "alias" as const,
          hint: `For "${alias}"`,
          href: null,
        })),
      ...books.map((row) => ({
        text: String(row.title),
        kind: "book" as const,
        hint: "Book",
        href: `/catalog/${Number(row.book_id)}`,
      })),
    ];

    const seen = new Set<string>();
    return all
      .filter((s) => {
        const k = s.text.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, limit);
  });
}
