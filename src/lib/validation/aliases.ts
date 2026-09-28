import { z } from "zod";

export const aliasSchema = z
  .object({
    alias: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9][a-z0-9+#/.]{0,39}$/, "One word, letters and digits, up to 40 characters"),
    expansion: z
      .string()
      .trim()
      .min(3, "Say what it stands for")
      .max(200, "Keep it under 200 characters"),
  })
  .refine((value) => value.expansion.toLowerCase() !== value.alias, {
    path: ["expansion"],
    message: "The expansion has to differ from the alias",
  });

export type AliasInput = z.infer<typeof aliasSchema>;
