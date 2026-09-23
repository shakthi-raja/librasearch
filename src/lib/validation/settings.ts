import { z } from "zod";

export const settingsSchema = z
  .object({
    finePerDay: z.coerce.number().min(0, "Cannot be negative").max(500),
    fineCap: z.coerce.number().min(0, "Cannot be negative").max(5000),
    lostCopyFee: z.coerce.number().min(0, "Cannot be negative").max(20_000),
    unpaidFineThreshold: z.coerce.number().min(0, "Cannot be negative").max(5000),
    holdExpiryHours: z.coerce.number().int().min(1).max(336),
    busyLoanDays: z.coerce.number().int().min(1).max(30),
    waitsForBusyLoan: z.coerce.number().int().min(1).max(50),
    shortLoanDays: z.coerce.number().int().min(1).max(30),
    shortageThreshold: z.coerce.number().min(0.01).max(10_000),
    weakMatchThreshold: z.coerce.number().min(0).max(1),
  })
  .refine((s) => s.fineCap >= s.finePerDay, {
    message: "The fine cap cannot be lower than the daily fine.",
    path: ["fineCap"],
  })
  .refine((s) => s.shortLoanDays <= s.busyLoanDays, {
    message: "A short loan cannot outlast the busy-period loan.",
    path: ["shortLoanDays"],
  });

export type SettingsInput = z.infer<typeof settingsSchema>;
