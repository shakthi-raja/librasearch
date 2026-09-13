import { z } from "zod";

/** Scanners type the barcode and press Enter; accept lower case for hand entry. */
export const barcodeSchema = z
  .string()
  .trim()
  .regex(/^LS[0-9]{8}$/i, "Barcodes look like LS26000003.")
  .transform((value) => value.toUpperCase());

export const memberIdentifierSchema = z
  .string()
  .trim()
  .min(3, "Enter a university ID or email.")
  .max(254, "That identifier is too long.");

export const issueSchema = z.object({
  member: memberIdentifierSchema,
  barcode: barcodeSchema,
});

export const returnSchema = z.object({
  barcode: barcodeSchema,
});

export type IssueInput = z.infer<typeof issueSchema>;
export type ReturnInput = z.infer<typeof returnSchema>;
