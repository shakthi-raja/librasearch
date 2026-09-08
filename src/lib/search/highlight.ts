export type Segment = { text: string; hit: boolean };

const STOP = new Set([
  "the",
  "and",
  "for",
  "how",
  "are",
  "with",
  "what",
  "does",
  "from",
  "into",
  "that",
  "this",
  "why",
]);

/** Words worth highlighting: three letters or more, lowercased, common words dropped. */
export function queryTerms(query: string): string[] {
  const words = query
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9+#]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
  return [...new Set(words)];
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Splits text into plain and matching segments. A term matches the start of
 * a word, so "normal" finds "normalisation". Returns a window around the
 * first match when the text is longer than `max`.
 */
export function highlight(text: string, terms: string[], max = 220): Segment[] {
  if (terms.length === 0) return [{ text: clip(text, 0, max), hit: false }];
  const pattern = new RegExp(`\\b(?:${terms.map(escapeRegExp).join("|")})[\\p{L}\\p{N}]*`, "giu");

  let start = 0;
  if (text.length > max) {
    const first = pattern.exec(text);
    pattern.lastIndex = 0;
    if (first) start = Math.max(0, text.lastIndexOf(" ", Math.max(0, first.index - 60)) + 1);
  }
  const window = clip(text, start, max);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of window.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ text: window.slice(cursor, index), hit: false });
    segments.push({ text: match[0], hit: true });
    cursor = index + match[0].length;
  }
  if (cursor < window.length) segments.push({ text: window.slice(cursor), hit: false });
  return segments;
}

function clip(text: string, start: number, max: number) {
  const end = start + max;
  if (start === 0 && text.length <= max) return text;
  const body = text.slice(start, end);
  const trimmed = end < text.length ? body.slice(0, body.lastIndexOf(" ")) : body;
  return `${start > 0 ? "…" : ""}${trimmed}${end < text.length ? "…" : ""}`;
}
