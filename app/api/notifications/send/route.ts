import { getMessaging } from "firebase-admin/messaging";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { ADMIN_EMAIL } from "@/lib/admin-config";
import { getAdminAuth, getAdminDb, getFirebaseAdminApp } from "@/lib/firebase-admin";

export const runtime = "nodejs";
const SITE_ORIGIN = "https://barrotvinternational.com";

function normalizeHttpsUrl(value: unknown, allowEmpty = false) {
  if (typeof value !== "string" || (!value && !allowEmpty) || value.length > 2048) return "";

  try {
    const url = new URL(value || "/", SITE_ORIGIN);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!idToken) return NextResponse.json({ message: "Authentification requise." }, { status: 401 });

  try {
    const user = await getAdminAuth().verifyIdToken(idToken);
    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
    }

    const body = await request.json() as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 300) : "";
    const url = normalizeHttpsUrl(typeof body.url === "string" ? body.url.trim() : "");
    const image = normalizeHttpsUrl(body.image ? String(body.image).trim() : "", true);
    if (!title || !message || !url || (body.image && !image)) {
      return NextResponse.json({ message: "Titre, message et URL HTTPS sont requis." }, { status: 400 });
    }

    const snapshot = await getAdminDb().collection("push_subscribers").get();
    const recipients = snapshot.docs
      .filter((doc) => doc.get("active") === true || doc.get("status") === "active")
      .map((doc) => ({ ref: doc.ref, token: doc.get("token") }))
      .filter((recipient): recipient is { ref: typeof snapshot.docs[number]["ref"]; token: string } => typeof recipient.token === "string" && recipient.token.length > 0);
    if (!recipients.length) {
      return NextResponse.json({ success: true, found: 0, sent: 0, failed: 0, message: "Aucun appareil actuellement abonné." }, { status: 200 });
    }

    const messaging = getMessaging(getFirebaseAdminApp());
    let sent = 0;
    let failed = 0;
    const invalidRefs: Array<typeof snapshot.docs[number]["ref"]> = [];
    const errors: string[] = [];
    for (let index = 0; index < recipients.length; index += 500) {
      const batch = recipients.slice(index, index + 500);
      const result = await messaging.sendEachForMulticast({
        tokens: batch.map((recipient) => recipient.token),
        notification: { title, body: message },
        data: { url, title, body: message, image: image || "" },
        android: { notification: { channelId: "barro_tv" } },
        webpush: {
          headers: { TTL: "86400" },
          notification: image
            ? { title, body: message, icon: "/logo.png", badge: "/logo.png", image }
            : { title, body: message, icon: "/logo.png", badge: "/logo.png" },
          fcmOptions: { link: url },
        },
      });
      sent += result.successCount;
      failed += result.failureCount;
      result.responses.forEach((response, responseIndex) => {
        if (!response.success) {
          const code = response.error?.code || "unknown";
          errors.push(code);
          if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
            invalidRefs.push(batch[responseIndex].ref);
          }
        }
      });
    }

    if (invalidRefs.length) {
      const batch = getAdminDb().batch();
      for (const ref of invalidRefs) {
        batch.set(ref, { active: false, status: "inactive", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
      await batch.commit();
    }

    return NextResponse.json({
      success: sent > 0,
      found: recipients.length,
      sent,
      failed,
      errors: [...new Set(errors)],
      message: sent > 0
        ? `Notification envoyée à ${sent} appareil(s).${failed ? ` Échec pour ${failed} appareil(s).` : ""}`
        : "Échec de l'envoi Firebase.",
    }, { status: sent > 0 ? 200 : 502 });
  } catch (error) {
    console.error("Push notification send error:", error);
    return NextResponse.json({ message: "Impossible d'envoyer la notification." }, { status: 500 });
  }
}