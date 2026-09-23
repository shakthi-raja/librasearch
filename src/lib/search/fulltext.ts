import { queryTerms } from "./highlight";

/**
 * Boolean-mode queries for MySQL FULLTEXT. Natural-language mode scores any
 * shared word, so "normal forms" also finds a chapter on forms of energy and
 * "computer networks" ranks neural networks first. These let the search rank
 * rows that contain every term, and the exact phrase, ahead of the rest.
 *
 * Only words InnoDB actually indexes are used: three characters or more and
 * not on its stopword list (queryTerms already applies both rules).
 */

const words = (query: string) =>
  queryTerms(query)
    .map((term) => term.replace(/[^a-z0-9]/g, ""))
    .filter((term) => term.length >= 3);

/** `+normal* +forms*`, or null when the query has fewer than two usable words. */
export function allTermsQuery(query: string): string | null {
  const terms = words(query);
  return terms.length >= 2 ? terms.map((term) => `+${term}*`).join(" ") : null;
}

/** `"normal forms"`, or null when there is no multi-word phrase to look for. */
export function phraseQuery(query: string): string | null {
  const terms = words(query);
  return terms.length >= 2 ? `"${terms.join(" ")}"` : null;
}
