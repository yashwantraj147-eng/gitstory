import { NextResponse } from "next/server";
import { getRateLimitStatus } from "@/lib/github/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getRateLimitStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        limit: 60,
        remaining: 60,
        reset: Math.floor(Date.now() / 1000) + 3600,
        used: 0,
        resetTimeFormatted: "Unknown",
      },
      { status: 200 }
    );
  }
}

