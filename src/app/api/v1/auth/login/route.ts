import { NextResponse } from "next/server";
import { signInSchema } from "@/lib/validation/auth";
import { sessionCookie } from "@/server/auth/cookie";
import { AppError } from "@/server/http/errors";
import { jsonBody, route } from "@/server/http/handler";
import { signIn } from "@/server/services/auth";

export const POST = route(async (request) => {
  const input = await jsonBody(request, signInSchema);
  const result = await signIn(input, {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  });
  if (!result.ok) {
    throw new AppError(
      "UNAUTHENTICATED",
      result.reason === "INACTIVE"
        ? "This account is not active. Please contact the library desk."
        : "University ID, email or password is incorrect",
    );
  }
  const response = NextResponse.json({ user: result.user });
  response.cookies.set(sessionCookie(result.token, result.expiresAt));
  return response;
});
