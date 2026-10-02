/**
 * Course-aware ranking. A chapter a coordinator approved for one of the
 * reader's units, or a chapter from a book their syllabus prescribes, rises
 * in the list and says why. Boosts multiply the score, so they work for any
 * mode's scale and never lift an irrelevant chapter above a strong match.
 */

export type SyllabusLink = { courseCode: string; unitNo: number; unitTitle: string };

export type ReaderContext = {
  /** Approved chapters for the reader's units, by chapter id. */
  chapters: ReadonlyMap<number, SyllabusLink>;
  /** Course codes that prescribe each book, by book id. */
  books: ReadonlyMap<number, string[]>;
};

export type Personal = { inSyllabus: SyllabusLink | null; prescribedFor: string[] };

export const UNIT_BOOST = 1.25;
export const PRESCRIBED_BOOST = 1.1;

export const EMPTY_CONTEXT: ReaderContext = { chapters: new Map(), books: new Map() };

export function personalise<T extends { chapterId: number; bookId: number; score: number }>(
  hits: T[],
  context: ReaderContext,
): (T & Personal)[] {
  return hits
    .map((hit, index) => {
      const inSyllabus = context.chapters.get(hit.chapterId) ?? null;
      const prescribedFor = context.books.get(hit.bookId) ?? [];
      const boost = inSyllabus ? UNIT_BOOST : prescribedFor.length > 0 ? PRESCRIBED_BOOST : 1;
      return { hit: { ...hit, inSyllabus, prescribedFor, score: hit.score * boost }, index };
    })
    .sort((a, b) => b.hit.score - a.hit.score || a.index - b.index)
    .map(({ hit }) => hit);
}

export const SUBJECT_BOOST = 0.08;
export const PRESCRIBED_BOOK_BOOST = 0.05;
export const BOOK_FLOOR = 0.62;

/**
 * Orders whole-book matches by what the query means here. A word like
 * "transactions" is close to finance books too; the subjects of the best
 * chapter results, and the reader's own syllabus, settle which sense is meant.
 */
export function rankBooks<B extends { bookId: number; similarity: number; categoryPath: string }>(
  books: B[],
  chapterSubjects: string[],
  context: ReaderContext,
  limit = 4,
): (B & { prescribedFor: string[] })[] {
  const subjects = new Set(chapterSubjects.slice(0, 5));
  return books
    .map((book) => {
      const prescribedFor = context.books.get(book.bookId) ?? [];
      const relevance =
        book.similarity +
        (subjects.has(book.categoryPath) ? SUBJECT_BOOST : 0) +
        (prescribedFor.length > 0 ? PRESCRIBED_BOOK_BOOST : 0);
      return { book: { ...book, prescribedFor }, relevance };
    })
    .filter((entry) => entry.relevance >= BOOK_FLOOR)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map((entry) => entry.book);
}
