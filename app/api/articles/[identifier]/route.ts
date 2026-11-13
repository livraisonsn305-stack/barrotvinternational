import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { toPublicArticle } from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await params;
  if (!identifier || identifier.includes("/")) {
    return NextResponse.json(
      { message: "Identifiant d’article invalide." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const articles = getAdminDb().collection("articles");
    const directSnapshot = await articles.doc(identifier).get();

    if (directSnapshot.exists) {
      const article = toPublicArticle(directSnapshot.id, directSnapshot.data() ?? {});
      return article
        ? NextResponse.json(article, { headers: { "Cache-Control": "no-store" } })
        : NextResponse.json(
            { message: "Article introuvable." },
            { status: 404, headers: { "Cache-Control": "no-store" } }
          );
    }

    const slugSnapshot = await articles
      .where("slug", "==", identifier)
      .where("status", "==", "published")
      .where("published", "==", true)
      .limit(1)
      .get();

    const document = slugSnapshot.docs[0];
    const article = document
      ? toPublicArticle(document.id, document.data())
      : null;

    return article
      ? NextResponse.json(article, { headers: { "Cache-Control": "no-store" } })
      : NextResponse.json(
          { message: "Article introuvable." },
          { status: 404, headers: { "Cache-Control": "no-store" } }
        );
  } catch (error) {
    console.error(
      "PUBLIC_ARTICLE_READ_ERROR",
      error instanceof Error ? error.message : "unknown error"
    );
    return NextResponse.json(
      { message: "Impossible de charger cet article." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
