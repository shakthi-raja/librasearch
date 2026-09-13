import { NextResponse } from "next/server";
import { returnSchema } from "@/lib/validation/circulation";
import { sessionCookieName } from "@/server/auth/cookie";
import { AppError } from "@/server/http/errors";
import { jsonBody, route } from "@/server/http/handler";
import { idempotencyKey, withIdempotency } from "@/server/http/idempotency";
import { sessionFromToken } from "@/server/services/auth";
import { returnCopy } from "@/server/services/circulation";

export const POST = route(async (request) => {
  const user = await sessionFromToken(request.cookies.get(sessionCookieName())?.value);
  if (user?.role !== "LIBRARIAN") {
    throw new AppError("FORBIDDEN", "Only a librarian can accept a return.");
  }

  const body = await jsonBody(request, returnSchema);
  const key = idempotencyKey(request.headers.get("idempotency-key"));
  const receipt = await withIdempotency(key, "return", () =>
    returnCopy({ barcode: body.barcode, actorId: user.userId }),
  );

  return NextResponse.json({ receipt });
});
