import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionCookieName } from "@/server/auth/cookie";
import { AppError } from "@/server/http/errors";
import { route } from "@/server/http/handler";
import { sessionFromToken } from "@/server/services/auth";
import { cancelHold } from "@/server/services/holds";

const idSchema = z.coerce.number().int().positive("A hold id is a positive number.");

export const DELETE = route<{ id: string }>(async (request, { params }) => {
  const user = await sessionFromToken(request.cookies.get(sessionCookieName())?.value);
  if (!user) throw new AppError("UNAUTHENTICATED", "Sign in first.");

  const holdId = idSchema.parse((await params).id);
  await cancelHold({ holdId, actorId: user.userId, role: user.role });

  return new NextResponse(null, { status: 204 });
});
