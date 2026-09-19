import { z } from "zod";

export const noticeSchema = z.object({
  audience: z.enum(["STUDENT", "FACULTY", "BOTH"]),
  title: z.string().trim().min(2, "Give the notice a title").max(120),
  body: z.string().trim().min(2, "Write the notice").max(500),
  link: z
    .string()
    .trim()
    .max(300)
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || value.startsWith("/"), "Links start with /"),
});

export type NoticeInput = z.infer<typeof noticeSchema>;
