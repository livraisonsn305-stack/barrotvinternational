import { NextResponse } from "next/server";

type SerpApiNewsResult = {
  title?: string;
  link?: string;
  source?: { name?: string };
  date?: string;
  snippet?: string;
  thumbnail?: string;
};

export const runtime = "nodejs";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query || query.length < 3 || query.length > 200) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ results: [], unavailable: true });
  }

  try {
    const serpApiUrl = new URL("https://serpapi.com/search.json");
    serpApiUrl.searchParams.set("engine", "google_news");
    serpApiUrl.searchParams.set("q", query);
    serpApiUrl.searchParams.set("hl", "fr");
    serpApiUrl.searchParams.set("gl", "sn");
    serpApiUrl.searchParams.set("api_key", apiKey);

    const response = await fetch(serpApiUrl, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error("SERPAPI_REQUEST_FAILED");

    const payload = (await response.json()) as { news_results?: SerpApiNewsResult[] };
    const results = (payload.news_results ?? []).slice(0, 6).flatMap((result) => {
      if (!result.title || !result.link) return [];

      return [{
        title: result.title,
        link: result.link,
        source: result.source?.name || "Source web",
        date: result.date || "",
        snippet: result.snippet || "",
        image: result.thumbnail,
      }];
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("EXTERNAL_SEARCH_ERROR", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ results: [], unavailable: true });
  }
}