import { NextRequest, NextResponse } from "next/server";
import { PluggableNarrativeGenerator } from "@/lib/narrative/llmProvider";
import { NarrativeContext, NarrativeTone } from "@/lib/narrative/types";

export const dynamic = "force-dynamic";

function isValidTone(tone: unknown): tone is NarrativeTone {
  return tone === "storyteller" || tone === "chronicle" || tone === "humorous";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      context?: NarrativeContext;
      tone?: unknown;
    };

    if (!body?.context?.repo || !body?.context?.metrics) {
      return NextResponse.json(
        { error: "Valid narrative context is required." },
        { status: 400 }
      );
    }

    const tone: NarrativeTone = isValidTone(body.tone) ? body.tone : "storyteller";
    const generator = new PluggableNarrativeGenerator();
    const narrative = await generator.generate(body.context, tone);

    return NextResponse.json({ success: true, data: narrative }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate narrative";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
