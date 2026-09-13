import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-09-01.");

export const termSchema = z
  .object({
    name: z.string().trim().min(2, "Give the term a name.").max(40),
    startDate: dateOnly,
    endDate: dateOnly,
    current: z.coerce.boolean().optional().default(false),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "The end date is before the start date.",
    path: ["endDate"],
  });

export const courseSchema = z.object({
  courseCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{5,12}$/, "Course codes are 5 to 12 capitals or digits."),
  title: z.string().trim().min(3, "Give the course a title.").max(160),
  deptId: z.coerce.number().int().positive("Choose a department."),
  semester: z.coerce.number().int().min(1).max(8),
  credits: z.coerce.number().int().min(1).max(6),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value ? value : null)),
});

export const offeringSchema = z.object({
  courseId: z.coerce.number().int().positive("Choose a course."),
  termId: z.coerce.number().int().positive("Choose a term."),
  section: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]$/, "A section is one capital letter."),
  coordinatorId: z.coerce.number().int().positive().nullable().catch(null),
  status: z.enum(["PLANNED", "RUNNING", "COMPLETED"]),
});

export type TermInput = z.infer<typeof termSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type OfferingInput = z.infer<typeof offeringSchema>;
