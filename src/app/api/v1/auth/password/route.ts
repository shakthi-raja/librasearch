import { NextResponse } from "next/server";
import { changePasswordSchema } from "@/lib/validation/auth";
import { sessionCookie, sessionCookieName } from "@/server/auth/cookie";
import { AppError } from "@/server/http/errors";
import { jsonBody, route } from "@/server/http/handler";
import { changePassword, sessionFromToken } from "@/server/services/auth";

export const POST = route(async (request) => {
  const user = await sessionFromToken(request.cookies.get(sessionCookieName())?.value);
  if (!user) throw new AppError("UNAUTHENTICATED", "Not signed in");
  const input = await jsonBody(request, changePasswordSchema);
  const result = await changePassword(user.userId, input.current, input.next, {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  });
  if (!result.ok) {
    throw new AppError(
      "VALIDATION",
      result.reason === "WRONG_PASSWORD"
        ? "Current password is incorrect"
        : "Choose a password you have not used here",
      [
        {
          path: result.reason === "WRONG_PASSWORD" ? "current" : "next",
          message: "Check this field",
        },
      ],
    );
  }
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(sessionCookie(result.token, result.expiresAt));
  return response;
});
