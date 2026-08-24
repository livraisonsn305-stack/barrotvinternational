import { NextResponse } from "next/server";

import { ADMIN_EMAIL } from "@/lib/admin-config";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      {
        error: "Email requis. Utilisez la connexion Firebase sur /connexion.",
        redirectTo: "/connexion",
      },
      { status: 400 }
    );
  }

  if (email !== ADMIN_EMAIL) {
    return NextResponse.json(
      {
        error: "Accès refusé. L'administration est limitée au compte Firebase autorisé.",
        redirectTo: "/connexion",
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      message: "Le login admin utilise désormais Firebase Authentication.",
      redirectTo: "/connexion",
    },
    { status: 200 }
  );
}
