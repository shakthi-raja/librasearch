import { NextResponse } from "next/server";
import { sessionCookieName } from "@/server/auth/cookie";
import { AppError } from "@/server/http/errors";
import { route } from "@/server/http/handler";
import { sessionFromToken } from "@/server/services/auth";

export const GET = route(async (request) => {
  const user = await sessionFromToken(request.cookies.get(sessionCookieName())?.value);
  if (!user) throw new AppError("UNAUTHENTICATED", "Not signed in");
  return NextResponse.json(
    {
      user: {
        userId: user.userId,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        universityId: user.universityId,
        mustChangePassword: user.mustChangePassword,
      },
      expiresAt: user.expiresAt.toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  );
});
