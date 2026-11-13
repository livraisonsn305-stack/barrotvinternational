import { NextResponse } from "next/server";

import { isCronRequestAuthorized, runNewsAutomation } from "@/lib/news-automation";

async function handleCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const isAuthorized = isCronRequestAuthorized(request, secret);

  if (!secret || !isAuthorized) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unauthorized: a valid CRON_SECRET is required.",
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const result = await runNewsAutomation();
    return NextResponse.json(
      { ok: true, result },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("NEWS_AUTOMATION_CRON_ERROR", error);
    return NextResponse.json(
      { ok: false, message: "News automation failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function GET(request: Request) {
  return handleCronRequest(request);
}

export async function POST(request: Request) {
  return handleCronRequest(request);
}
