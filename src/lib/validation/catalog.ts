import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Enter a title").max(200),
  subtitle: optionalText(200),
  categoryId: z.coerce.number().int().positive("Choose a subject"),
  description: z.string().trim().min(20, "Describe the book in at least 20 characters").max(4000),
  authors: z
    .string()
    .trim()
    .min(2, "Enter at least one author")
    .transform((v) =>
      v
        .split(/[,;\n]/)
        .map((a) => a.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(120)).min(1).max(12)),
});

export const editionSchema = z.object({
  isbn13: z
    .string()
    .trim()
    .transform((v) => v.replace(/[-\s]/g, ""))
    .pipe(z.string().regex(/^97[89]\d{10}$/, "An ISBN-13 is 13 digits starting with 978 or 979")),
  editionNo: z.coerce.number().int().min(1).max(50),
  pubYear: z.coerce.number().int().min(1900).max(2100),
  pageCount: z.coerce.number().int().min(1).max(5000),
  publisherId: z.coerce.number().int().positive().nullable().catch(null),
  format: z.enum(["HARDCOVER", "PAPERBACK"]),
});

export const copySchema = z.object({
  editionId: z.coerce.number().int().positive(),
  rack: z.string().regex(/^[A-Z]{2,3}-\d{2}$/, "Choose a rack"),
  shelf: z.string().regex(/^S[1-9]$/, "Choose a shelf"),
  count: z.coerce.number().int().min(1).max(20),
  loanPolicy: z.enum(["REGULAR", "SHORT_LOAN", "REFERENCE_ONLY"]),
});

export const copyStateSchema = z.object({
  copyId: z.coerce.number().int().positive(),
  status: z.enum(["AVAILABLE", "DAMAGED", "LOST", "WITHDRAWN"]),
  loanPolicy: z.enum(["REGULAR", "SHORT_LOAN", "REFERENCE_ONLY"]),
});
