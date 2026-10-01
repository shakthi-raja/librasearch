/**
 * Understanding a typed query before it is searched: abbreviations become
 * the words they stand for, and a course code is recognised as a course.
 */

export type Expansion = { alias: string; expansion: string };

export type UnderstoodQuery = {
  /** What the person typed, trimmed. */
  original: string;
  /** What keyword and semantic search actually run on. */
  text: string;
  expansions: Expansion[];
  /** Set when the whole query is a course code such as UE24CS351A. */
  courseCode: string | null;
};

const COURSE_CODE = /^UE\d{2}[A-Z]{2}\d{3}[A-Z0-9]{1,4}$/i;

export const MAX_QUERY_LENGTH = 200;

export function normaliseQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
}

/** Lower-case key an alias is stored and looked up under. */
export function aliasKey(word: string): string {
  return word.toLowerCase().replace(/^[.,;:!?'"()]+|[.,;:!?'"()]+$/g, "");
}

/**
 * Replaces each word that is a known alias with its expansion. Words are
 * split on spaces only, so forms like ui/ux and c++ survive intact, and a
 * quoted query is taken literally.
 */
export function expandQuery(query: string, aliases: ReadonlyMap<string, string>): UnderstoodQuery {
  const original = normaliseQuery(query);
  const courseCode = COURSE_CODE.test(original) ? original.toUpperCase() : null;
  const expansions: Expansion[] = [];
  if (/^".*"$/.test(original)) {
    return { original, text: original.slice(1, -1).trim(), expansions, courseCode: null };
  }

  const words = original.split(" ").map((word) => {
    const key = aliasKey(word);
    const expansion = aliases.get(key);
    if (!expansion) return word;
    if (!expansions.some((e) => e.alias === key)) expansions.push({ alias: key, expansion });
    return expansion;
  });

  return { original, text: words.join(" "), expansions, courseCode };
}
