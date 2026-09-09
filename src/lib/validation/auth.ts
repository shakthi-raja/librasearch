import { z } from "zod";

/** University ID or email, normalised the way the database stores them. */
export const loginIdentifier = z
  .string()
  .trim()
  .min(3, "Enter your university ID or email")
  .max(254)
  .transform((value) => (value.includes("@") ? value.toLowerCase() : value.toUpperCase()));

export const password = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Use at most 128 characters")
  .refine((value) => /[a-z]/i.test(value) && /\d/.test(value), "Mix letters and numbers");

export const signInSchema = z.object({
  identifier: loginIdentifier,
  // existing passwords are checked, not judged, so only bound the length here
  password: z.string().min(1, "Enter your password").max(128),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password").max(128),
    next: password,
    confirm: z.string(),
  })
  .refine((value) => value.next === value.confirm, {
    path: ["confirm"],
    message: "The two new passwords do not match",
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
