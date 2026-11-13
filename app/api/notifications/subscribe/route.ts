import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token || token.length > 4096) {
      return NextResponse.json({ message: "Token de notification invalide." }, { status: 400 });
    }

    const id = createHash("sha256").update(token).digest("hex");
    const ref = getAdminDb().collection("push_subscribers").doc(id);
    const current = await ref.get();
    const payload = {
      token,
      userAgent: typeof body.userAgent === "string" ? body.userAgent.slice(0, 500) : "",
      browser: typeof body.browser === "string" ? body.browser.slice(0, 120) : "",
      platform: typeof body.platform === "string" ? body.platform.slice(0, 120) : "",
      active: true,
      status: "active",
      updatedAt: FieldValue.serverTimestamp(),
      ...(current.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };

    await ref.set(payload, { merge: true });

    return NextResponse.json({ message: "Abonnement enregistré.", active: true }, { status: 201 });
  } catch (error) {
    console.error("Push subscription error:", error);
    return NextResponse.json({ message: "Impossible d'enregistrer l'abonnement." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "push_subscribers" });
}