import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  const email =
    body && typeof body === "object" && !Array.isArray(body) && typeof (body as { email?: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";

  if (!email) {
    return NextResponse.json({ message: "Veuillez saisir votre adresse e-mail." }, { status: 400 });
  }

  if (!emailRegex.test(email)) {
    return NextResponse.json({ message: "Veuillez saisir une adresse e-mail valide." }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const subscriberRef = db.collection("subscribers").doc(email);
    const alreadyExists = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(subscriberRef);
      if (snapshot.exists) return true;

      transaction.create(subscriberRef, {
        email,
        createdAt: FieldValue.serverTimestamp(),
        source: "homepage-newsletter",
      });
      return false;
    });

    if (alreadyExists) {
      return NextResponse.json(
        { message: "Cette adresse est déjà inscrite à notre newsletter." },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "Inscription réussie." }, { status: 201 });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de l'inscription. Veuillez réessayer." },
      { status: 500 },
    );
  }
}