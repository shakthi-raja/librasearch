export type CandidateBook = {
  bookId: number;
  title: string;
  authors: string;
  isbn13: string | null;
  year: number | null;
};

export type DuplicateCandidate = CandidateBook & {
  score: number;
  reason: "same-isbn" | "same-author" | "similar-title";
};

/** Words that carry no signal when two book titles are compared. */
const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "de",
  "edition",
  "for",
  "in",
  "of",
  "on",
  "the",
  "to",
  "with",
]);

export function titleTokens(value: string): Set<string> {
  const words = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
  return new Set(words);
}

/** Jaccard overlap of the meaningful words in two titles, between 0 and 1. */
export function titleSimilarity(left: string, right: string): number {
  const a = titleTokens(left);
  const b = titleTokens(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / (a.size + b.size - shared);
}

const authorTokens = (value: string) => titleTokens(value);

/**
 * Looks for books the request may already own: an identical ISBN is decisive,
 * otherwise a close title with a matching author surname is still worth a look.
 */
export function findDuplicates(
  request: { title: string; author?: string | null; isbn13?: string | null },
  books: CandidateBook[],
  limit = 3,
): DuplicateCandidate[] {
  const found: DuplicateCandidate[] = [];
  const author = authorTokens(request.author ?? "");

  for (const book of books) {
    if (request.isbn13 && book.isbn13 === request.isbn13) {
      found.push({ ...book, score: 1, reason: "same-isbn" });
      continue;
    }
    const score = titleSimilarity(request.title, book.title);
    if (score < 0.45) continue;
    const sharesAuthor = [...author].some((word) => authorTokens(book.authors).has(word));
    found.push({
      ...book,
      score: Math.round(score * 100) / 100,
      reason: sharesAuthor ? "same-author" : "similar-title",
    });
  }

  return found.sort((a, b) => b.score - a.score).slice(0, limit);
}
