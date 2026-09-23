import { NextResponse } from "next/server";
import { currentUser } from "@/server/auth/current";
import { route } from "@/server/http/handler";
import { runSearch, type SearchMode } from "@/server/search/run";

export const GET = route(async (request) => {
  const params = request.nextUrl.searchParams;
  const query = (params.get("q") ?? "").trim();
  const mode: SearchMode =
    params.get("mode") === "semantic" || params.get("mode") === "keyword"
      ? (params.get("mode") as SearchMode)
      : "hybrid";
  const number = (value: string | null) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  };

  const yearFrom = number(params.get("yearFrom"));
  const yearTo = number(params.get("yearTo"));
  const category = params.get("category");
  const language = params.get("language");
  const user = await currentUser();
  const result = await runSearch(
    query,
    mode,
    {
      ...(category ? { categorySlug: category } : {}),
      ...(language ? { language } : {}),
      ...(yearFrom !== undefined ? { yearFrom } : {}),
      ...(yearTo !== undefined ? { yearTo } : {}),
    },
    user?.userId ?? null,
  );

  return NextResponse.json(result);
});
