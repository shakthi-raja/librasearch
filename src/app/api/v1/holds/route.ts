import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionCookieName } from "@/server/auth/cookie";
import { AppError } from "@/server/http/errors";
import { jsonBody, route } from "@/server/http/handler";
import { sessionFromToken } from "@/server/services/auth";
import { placeHold } from "@/server/services/holds";

const schema = z.object({ bookId: z.coerce.number().int().positive() });

export const POST = route(async (request) => {
  const user = await sessionFromToken(request.cookies.get(sessionCookieName())?.value);
  if (!user || (user.role !== "STUDENT" && user.role !== "FACULTY")) {
    throw new AppError("FORBIDDEN", "Only a member can place a hold.");
  }

  const body = await jsonBody(request, schema);
  const holdId = await placeHold({ bookId: body.bookId, memberId: user.userId, role: user.role });

  return NextResponse.json({ holdId }, { status: 201 });
});
