import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionCookieName } from "@/server/auth/cookie";
import { AppError } from "@/server/http/errors";
import { route } from "@/server/http/handler";
import { sessionFromToken } from "@/server/services/auth";
import { renewLoan } from "@/server/services/circulation";

const idSchema = z.coerce.number().int().positive("A loan id is a positive number.");

export const POST = route<{ id: string }>(async (request, { params }) => {
  const user = await sessionFromToken(request.cookies.get(sessionCookieName())?.value);
  if (!user) throw new AppError("UNAUTHENTICATED", "Sign in first.");

  const loanId = idSchema.parse((await params).id);
  const due = await renewLoan({ loanId, actorId: user.userId, role: user.role });

  return NextResponse.json({ dueAt: due.toISOString() });
});
