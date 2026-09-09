import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Type at least two characters")
    .max(200, "Keep the search under 200 characters"),
});
