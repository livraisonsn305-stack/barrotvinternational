import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_TOKEN_COOKIE } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.redirect(
    new URL("/connexion", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  );

  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(ADMIN_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
