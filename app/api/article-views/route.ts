import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof (body as { articleId?: unknown }).articleId !== "string"
  ) {
    return NextResponse.json({ error: "articleId is required." }, { status: 400 });
  }

  const articleId = (body as { articleId: string }).articleId.trim();
  if (!articleId || articleId.length > 150 || articleId.includes("/")) {
    return NextResponse.json({ error: "Invalid articleId." }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const articleRef = db.collection("articles").doc(articleId);
    const views = await db.runTransaction(async (transaction) => {
      const articleSnapshot = await transaction.get(articleRef);

      if (!articleSnapshot.exists || articleSnapshot.data()?.status !== "published") {
        throw new Error("ARTICLE_NOT_FOUND");
      }

      const currentViews = Number(articleSnapshot.data()?.views ?? 0);
      const nextViews = Number.isSafeInteger(currentViews) && currentViews >= 0 ? currentViews + 1 : 1;
      transaction.update(articleRef, { views: FieldValue.increment(1) });
      return nextViews;
    });

    return NextResponse.json({ views });
  } catch (error) {
    if (error instanceof Error && error.message === "ARTICLE_NOT_FOUND") {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    console.error("Article view increment error:", error);
    return NextResponse.json({ error: "Unable to record article view." }, { status: 500 });
  }
}