import { NextResponse } from "next/server";
import { route } from "@/server/http/handler";
import { suggestions } from "@/server/search/suggest";

export const GET = route(async (request) => {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json(
    { suggestions: await suggestions(query) },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
});
