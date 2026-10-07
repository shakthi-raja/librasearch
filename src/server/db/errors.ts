import { AppError } from "@/server/http/errors";

type MysqlError = { errno?: number; sqlMessage?: string };

const isMysqlError = (error: unknown): error is MysqlError =>
  typeof error === "object" && error !== null && "errno" in error;

/** Messages for the LSnnn codes the schema raises with SIGNAL. */
const SIGNALS: Record<string, string> = {
  LS001: "This member cannot borrow right now.",
  LS002: "No copy has that barcode.",
  LS003: "That copy is not on the shelf. Check its status.",
  LS004: "Reference copies stay in the library.",
  LS005: "This member has reached the loan limit.",
  LS006: "This member has unpaid fines above the limit.",
  LS007: "That copy is reserved for another member.",
  LS008: "This book is withdrawn from the shelf.",
  LS009: "Only a librarian can use the desk.",
  LS010: "No open loan matches that barcode.",
  LS011: "This loan has reached its renewal limit.",
  LS012: "Another member is waiting for this book.",
  LS013: "Overdue loans cannot be renewed.",
  LS014: "Only the borrower or a librarian can renew this loan.",
  LS015: "This member already has a hold on that book.",
  LS016: "A copy is on the shelf, so no hold is needed.",
  LS017: "That hold is already closed.",
  LS018: "Only the holder or a librarian can cancel that hold.",
  LS101: "The coordinator must be active faculty of the course's department.",
  LS102: "Only active students can be enrolled.",
  LS201: "A subject cannot be moved under one of its own subjects.",
  LS202: "The previous edition must be an earlier edition of the same book.",
  LS203: "Chapter pages run past the end of the edition.",
  LS301: "This stocktake is closed; start a new one to scan again.",
};

const UNIQUE: Record<string, string> = {
  uq_editions_isbn: "Another edition already has this ISBN.",
  uq_editions_number: "This book already has an edition with that number.",
  uq_copies_barcode: "Another copy already has this barcode.",
  uq_copies_accession: "Another copy already has this accession number.",
  uq_categories_slug: "A subject with that name already exists.",
  uq_academic_terms_name: "A term with that name already exists.",
  uq_courses_code: "Another course already uses that code.",
  uq_course_offerings_section: "This course already has an offering in that term and section.",
};

const CHECKS: Record<string, string> = {
  ck_editions_isbn_checksum: "That ISBN's check digit is wrong. Check the number on the book.",
  ck_editions_isbn_format: "An ISBN-13 is 13 digits starting with 978 or 979.",
  ck_copies_rack: "Rack codes look like CS-04.",
  ck_copies_reference_on_loan: "A reference-only copy cannot be on loan. Return it first.",
};

/**
 * Turns a MySQL error into the one error type the app shows. The database
 * stays the authority on the rule; this only translates its answer.
 */
export function mapDbError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (!isMysqlError(error)) return new AppError("INTERNAL", "Something went wrong");
  const message = error.sqlMessage ?? "";
  const code = /^(LS\d{3})/.exec(message)?.[1];

  if (error.errno === 1644 && code)
    return new AppError("CONFLICT", SIGNALS[code] ?? message.replace(/^LS\d{3}: /, ""));
  if (error.errno === 1062) {
    const key = Object.keys(UNIQUE).find((k) => message.includes(k));
    return new AppError("CONFLICT", key ? (UNIQUE[key] as string) : "That record already exists.");
  }
  if (error.errno === 3819) {
    const key = Object.keys(CHECKS).find((k) => message.includes(k));
    return new AppError(
      "VALIDATION",
      key ? (CHECKS[key] as string) : "A value is outside what the library allows.",
    );
  }
  if (error.errno === 1451)
    return new AppError("CONFLICT", "Other records still depend on this one.");
  if (error.errno === 1142 || error.errno === 1143)
    return new AppError("FORBIDDEN", "Your account cannot change this.");
  return new AppError("INTERNAL", "Something went wrong");
}
