import { NarrativeContext, NarrativeProvider, NarrativeTone } from "./types";
import { StoryNarrative } from "../analytics/types";
import { TemplateNarrativeEngine } from "./templateEngine";

interface RawLlmChapter {
  id?: unknown;
  title?: unknown;
  timeframe?: unknown;
  summary?: unknown;
  content?: unknown;
  highlightMetric?: unknown;
}

function isValidNarrativeShape(
  value: unknown
): value is {
  title: string;
  subtitle: string;
  chapters: Array<{
    id: string;
    title: string;
    timeframe: string;
    summary: string;
    content: string;
    highlightMetric?: string;
  }>;
} {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.title !== "string" || typeof obj.subtitle !== "string") return false;
  if (!Array.isArray(obj.chapters) || obj.chapters.length === 0) return false;

  return obj.chapters.every((ch: unknown) => {
    if (!ch || typeof ch !== "object") return false;
    const item = ch as RawLlmChapter;
    return (
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.timeframe === "string" &&
      typeof item.summary === "string" &&
      typeof item.content === "string" &&
      (item.highlightMetric === undefined || typeof item.highlightMetric === "string")
    );
  });
}

function buildNarrativePrompt(context: NarrativeContext, tone: NarrativeTone): string {
  return `You are a tech historian and software biographer.
Analyze the following Git repository statistics and write a compelling 4-chapter narrative biography of this project.

Repository: ${context.repo.full_name} (${context.repo.description || ""})
Stars: ${context.repo.stargazers_count}, Forks: ${context.repo.forks_count}
Primary Language: ${context.languages.primaryLanguage || "Code"}
Total Commits Analyzed: ${context.metrics.totalCommitsAnalyzed} (Estimated Total: ${context.metrics.totalCommitCountEstimate})
Lifespan: ${context.metrics.lifespanFormatted}
Velocity: ${context.metrics.commitVelocityPerMonth} commits/month
Night Owl Commits: ${context.metrics.nightOwlPercentage}%
Weekend Commits: ${context.metrics.weekendHackerPercentage}%
Peak Rhythm: ${context.heatmap.peakDayName}s at ${context.heatmap.peakHourLabel}
Contributors: ${context.contributors.totalUniqueAuthors} unique authors (Lead: ${context.contributors.topContributors[0]?.login || "founder"})
Milestones Count: ${context.milestones.length}

Tone requested: ${tone} (storyteller = inspiring & epic; chronicle = architectural & engineering; humorous = witty indie hacker).

Output MUST be strictly valid JSON matching this schema:
{
  "title": "string",
  "subtitle": "string",
  "chapters": [
    {
      "id": "ch1",
      "title": "Chapter Title",
      "timeframe": "Time period",
      "summary": "Short 1-line summary",
      "content": "Paragraph of narrative text",
      "highlightMetric": "Key metric label"
    }
  ]
}`;
}

export class GeminiNarrativeProvider implements NarrativeProvider {
  name = "gemini";

  constructor(private apiKey: string) {}

  async generateNarrative(context: NarrativeContext, tone: NarrativeTone = "storyteller"): Promise<StoryNarrative> {
    const prompt = buildNarrativePrompt(context, tone);
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini API returned empty content");
    }

    const parsed: unknown = JSON.parse(text);
    if (!isValidNarrativeShape(parsed)) {
      throw new Error("Gemini API returned invalid narrative JSON shape");
    }

    return {
      title: parsed.title,
      subtitle: parsed.subtitle,
      chapters: parsed.chapters,
      tone,
      generatedBy: "ai",
    };
  }
}

export class OpenAINarrativeProvider implements NarrativeProvider {
  name = "openai";

  constructor(private apiKey: string) {}

  async generateNarrative(context: NarrativeContext, tone: NarrativeTone = "storyteller"): Promise<StoryNarrative> {
    const prompt = buildNarrativePrompt(context, tone);
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI API returned empty content");
    }

    const parsed: unknown = JSON.parse(content);
    if (!isValidNarrativeShape(parsed)) {
      throw new Error("OpenAI API returned invalid narrative JSON shape");
    }

    return {
      title: parsed.title,
      subtitle: parsed.subtitle,
      chapters: parsed.chapters,
      tone,
      generatedBy: "ai",
    };
  }
}

export class PluggableNarrativeGenerator {
  private templateEngine = new TemplateNarrativeEngine();

  async generate(context: NarrativeContext, tone: NarrativeTone = "storyteller"): Promise<StoryNarrative> {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey && geminiKey.trim()) {
      try {
        const provider = new GeminiNarrativeProvider(geminiKey.trim());
        return await provider.generateNarrative(context, tone);
      } catch (err) {
        console.warn("Gemini narrative provider failed, falling back to template engine:", err);
      }
    }

    if (openaiKey && openaiKey.trim()) {
      try {
        const provider = new OpenAINarrativeProvider(openaiKey.trim());
        return await provider.generateNarrative(context, tone);
      } catch (err) {
        console.warn("OpenAI narrative provider failed, falling back to template engine:", err);
      }
    }

    return this.templateEngine.generate(context, tone);
  }
}
