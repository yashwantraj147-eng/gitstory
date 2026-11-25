import { NextResponse } from "next/server";
import { getRateLimitStatus } from "@/lib/github/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getRateLimitStatus();
  return NextResponse.json(status, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
