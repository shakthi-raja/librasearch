import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value));

export const purchaseRequestSchema = z.object({
  title: z.string().trim().min(2, "Enter the book you need").max(200),
  author: optionalText(160),
  isbn13: z
    .string()
    .trim()
    .transform((value) => value.replace(/[-\s]/g, ""))
    .refine((value) => value === "" || /^97[89]\d{10}$/.test(value), "Enter a valid ISBN-13"),
  quantity: z.coerce.number().int().min(1, "Ask for at least one copy").max(50),
  reason: z.string().trim().min(5, "Say why the library should buy it").max(2000),
});

export const decisionSchema = z.object({
  requestId: z.coerce.number().int().positive(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.preprocess((value) => (value == null ? "" : value), optionalText(300)),
});

export type PurchaseRequestInput = z.infer<typeof purchaseRequestSchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;
