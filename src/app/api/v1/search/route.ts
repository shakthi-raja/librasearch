import { NextResponse } from "next/server";
import { searchQuerySchema } from "@/lib/validation/search";
import { sessionCookieName } from "@/server/auth/cookie";
import { route } from "@/server/http/handler";
import { sessionFromToken } from "@/server/services/auth";
import { keywordSearch } from "@/server/services/search";

export const GET = route(async (request) => {
  const { q } = searchQuerySchema.parse({ q: request.nextUrl.searchParams.get("q") ?? "" });
  const user = await sessionFromToken(request.cookies.get(sessionCookieName())?.value);
  const result = await keywordSearch(q, user?.userId ?? null);
  return NextResponse.json({ mode: "keyword", query: q, ...result });
});
