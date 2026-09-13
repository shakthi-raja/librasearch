import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionCookieName } from "@/server/auth/cookie";
import { AppError } from "@/server/http/errors";
import { jsonBody, route } from "@/server/http/handler";
import { sessionFromToken } from "@/server/services/auth";
import { settleFineRecord } from "@/server/services/fines";

const idSchema = z.coerce.number().int().positive("A fine id is a positive number.");
const bodySchema = z
  .object({
    action: z.enum(["PAID", "WAIVED"]),
    reason: z
      .string()
      .trim()
      .min(5, "Give a waiver reason of at least 5 characters.")
      .max(300)
      .optional(),
  })
  .refine((value) => value.action === "PAID" || value.reason !== undefined, {
    message: "A waiver needs a reason.",
    path: ["reason"],
  });

export const PATCH = route<{ id: string }>(async (request, { params }) => {
  const user = await sessionFromToken(request.cookies.get(sessionCookieName())?.value);
  if (user?.role !== "LIBRARIAN") {
    throw new AppError("FORBIDDEN", "Only a librarian can settle a fine.");
  }

  const fineId = idSchema.parse((await params).id);
  const body = await jsonBody(request, bodySchema);
  await settleFineRecord({
    fineId,
    action: body.action,
    reason: body.reason ?? null,
    actorId: user.userId,
  });

  return NextResponse.json({ fineId });
});
