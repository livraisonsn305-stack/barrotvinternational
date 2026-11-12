import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { toPublicArticle } from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await getAdminDb()
      .collection("articles")
      .where("status", "==", "published")
      .where("published", "==", true)
      .get();

    const articles = snapshot.docs
      .map((document) => toPublicArticle(document.id, document.data()))
      .filter((article) => article !== null);

    return NextResponse.json(articles, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(
      "PUBLIC_ARTICLES_READ_ERROR",
      error instanceof Error ? error.message : "unknown error"
    );
    return NextResponse.json(
      { message: "Impossible de charger les articles publiés." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
