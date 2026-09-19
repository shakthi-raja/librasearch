export type CategoryRef = { id: number; name: string; slug: string };

export type CsvBookRow = {
  line: number;
  title: string;
  authors: string[];
  isbn13: string;
  categoryId: number;
  copies: number;
  year: number;
};

export type ImportRow = Omit<CsvBookRow, "categoryId"> & {
  category: string;
  categoryId: number;
  issues: string[];
};

export type ImportPreview = {
  rows: ImportRow[];
  valid: number;
  invalid: number;
  error?: string;
};

export function isValidIsbn13(value: string): boolean {
  if (!/^97[89]\d{10}$/.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(value[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10 === Number(value[12]);
}

/** Splits one CSV line, honouring quoted fields and doubled quotes. */
function splitLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

export function parseCsv(text: string): {
  header: string[];
  rows: { line: number; cells: string[] }[];
} {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return { header: [], rows: [] };

  const header = splitLine(lines[0] ?? "").map((cell) => cell.toLowerCase());
  const rows = lines.slice(1).map((line, index) => ({
    line: index + 2,
    cells: splitLine(line),
  }));
  return { header, rows };
}

const REQUIRED = ["title", "authors", "isbn13", "category"] as const;

/**
 * Turns the pasted CSV into rows with a list of problems each. Nothing is
 * written here; the page shows this report before the librarian imports.
 */
export function previewCsv(
  text: string,
  categories: CategoryRef[],
  existingIsbns: Set<string> = new Set(),
): ImportPreview {
  const { header, rows } = parseCsv(text);
  if (header.length === 0) return { rows: [], valid: 0, invalid: 0, error: "The file is empty." };

  const missing = REQUIRED.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return { rows: [], valid: 0, invalid: 0, error: `Missing column: ${missing.join(", ")}.` };
  }

  const index = (name: string) => header.indexOf(name);
  const byName = new Map(categories.map((category) => [category.name.toLowerCase(), category]));
  const bySlug = new Map(categories.map((category) => [category.slug.toLowerCase(), category]));
  const seen = new Set<string>();
  const out: ImportRow[] = [];

  for (const row of rows) {
    const cell = (name: string) => row.cells[index(name)] ?? "";
    const title = cell("title");
    const authors = cell("authors")
      .split(";")
      .map((author) => author.trim())
      .filter(Boolean);
    const isbn13 = cell("isbn13").replace(/[-\s]/g, "");
    const category = cell("category");
    const copiesText = cell("copies") || "1";
    const yearText = cell("year") || String(new Date().getFullYear());

    const issues: string[] = [];
    if (!title) issues.push("Title is missing.");
    if (authors.length === 0) issues.push("Add at least one author.");
    if (!isValidIsbn13(isbn13)) issues.push("ISBN-13 is not valid.");
    else if (seen.has(isbn13)) issues.push("ISBN appears twice in the file.");
    else seen.add(isbn13);
    if (isValidIsbn13(isbn13) && existingIsbns.has(isbn13)) {
      issues.push("ISBN is already in the catalogue.");
    }

    const match = byName.get(category.toLowerCase()) ?? bySlug.get(category.toLowerCase());
    if (!match) issues.push(`Unknown category "${category}".`);

    const copies = Number(copiesText);
    if (!Number.isInteger(copies) || copies < 1 || copies > 20) {
      issues.push("Copies must be a whole number from 1 to 20.");
    }
    const year = Number(yearText);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      issues.push("Year must be between 1900 and 2100.");
    }

    out.push({
      line: row.line,
      title,
      authors,
      isbn13,
      category,
      copies,
      year,
      issues,
      categoryId: match?.id ?? 0,
    });
  }

  const valid = out.filter((row) => row.issues.length === 0).length;
  return { rows: out, valid, invalid: out.length - valid };
}

/** Rows from the preview that can be written, with their resolved category. */
export function importable(preview: ImportPreview): CsvBookRow[] {
  return preview.rows
    .filter((row) => row.issues.length === 0)
    .map((row) => ({
      line: row.line,
      title: row.title,
      authors: row.authors,
      isbn13: row.isbn13,
      categoryId: row.categoryId,
      copies: row.copies,
      year: row.year,
    }));
}
