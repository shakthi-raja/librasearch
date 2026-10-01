/**
 * Books whose authors publish the full text, or most of it, for free. Each
 * link is the authors' own site; a licence is named only where the authors
 * state one. Keyed by the ISBN-13 of an edition the catalogue holds.
 */
export type OpenResourceSeed = {
  isbn13: string;
  url: string;
  kind: "FULL_TEXT" | "CHAPTERS" | "LECTURES";
  provider: string;
  licence?: string;
};

export const OPEN_RESOURCES: OpenResourceSeed[] = [
  {
    isbn13: "9781098155438",
    url: "https://allendowney.github.io/ThinkPython/",
    kind: "FULL_TEXT",
    provider: "Allen B. Downey",
    licence: "CC BY-NC-SA 4.0",
  },
  {
    isbn13: "9781718504509",
    url: "https://automatetheboringstuff.com/3e/",
    kind: "FULL_TEXT",
    provider: "Al Sweigart",
    licence: "CC BY-NC-SA",
  },
  {
    isbn13: "9781071614181",
    url: "https://www.statlearning.com/",
    kind: "FULL_TEXT",
    provider: "The authors",
  },
  {
    isbn13: "9781492031086",
    url: "https://clauswilke.com/dataviz/",
    kind: "FULL_TEXT",
    provider: "Claus O. Wilke",
  },
  {
    isbn13: "9780244768522",
    url: "https://christophm.github.io/interpretable-ml-book/",
    kind: "FULL_TEXT",
    provider: "Christoph Molnar",
  },
  {
    isbn13: "9783030343712",
    url: "https://szeliski.org/Book/",
    kind: "FULL_TEXT",
    provider: "Richard Szeliski",
  },
  {
    isbn13: "9783031015885",
    url: "https://www.cs.mcgill.ca/~wlh/grl_book/",
    kind: "FULL_TEXT",
    provider: "William L. Hamilton",
  },
  {
    isbn13: "9798985593112",
    url: "https://www.thomaswong.net/",
    kind: "FULL_TEXT",
    provider: "Thomas G. Wong",
  },
  {
    isbn13: "9781108182874",
    url: "https://lavalle.pl/vr/",
    kind: "FULL_TEXT",
    provider: "Steven M. LaValle",
  },
  {
    isbn13: "9780135041963",
    url: "https://web.stanford.edu/~jurafsky/slp3/",
    kind: "CHAPTERS",
    provider: "Daniel Jurafsky and James H. Martin",
  },
  {
    isbn13: "9781439821916",
    url: "https://cacr.uwaterloo.ca/hac/",
    kind: "CHAPTERS",
    provider: "Centre for Applied Cryptographic Research, Waterloo",
  },
  {
    isbn13: "9781985086593",
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/",
    kind: "CHAPTERS",
    provider: "Remzi and Andrea Arpaci-Dusseau",
  },
  {
    isbn13: "9780262510875",
    url: "https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/6515/sicp.zip/index.html",
    kind: "FULL_TEXT",
    provider: "MIT Press",
    licence: "CC BY-SA 4.0",
  },
  {
    isbn13: "9780262035613",
    url: "https://www.deeplearningbook.org/",
    kind: "FULL_TEXT",
    provider: "Ian Goodfellow, Yoshua Bengio and Aaron Courville",
  },
];
