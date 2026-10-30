import { NarrativeContext, NarrativeProvider, NarrativeTone } from "./types";
import { StoryNarrative } from "../analytics/types";
import { TemplateNarrativeEngine } from "./templateEngine";

export class GeminiNarrativeProvider implements NarrativeProvider {
  name = "gemini";

  constructor(private apiKey: string) {}

  async generateNarrative(context: NarrativeContext, tone: NarrativeTone = "storyteller"): Promise<StoryNarrative> {
    const prompt = `You are a legendary tech historian and software biographer.
Analyze the following Git repository statistics and write a compelling 4-chapter narrative biography of this project.

Repository: ${context.repo.full_name} (${context.repo.description || ""})
Stars: ${context.repo.stargazers_count}, Forks: ${context.repo.forks_count}
Primary Language: ${context.languages.primaryLanguage || "Code"}
Total Commits Analyzed: ${context.metrics.totalCommitsAnalyzed}
Lifespan: ${context.metrics.lifespanFormatted}
Velocity: ${context.metrics.commitVelocityPerMonth} commits/month
Night Owl Commits: ${context.metrics.nightOwlPercentage}%
Weekend Commits: ${context.metrics.weekendHackerPercentage}%
Peak Rhythm: ${context.heatmap.peakDayName}s at ${context.heatmap.peakHourLabel}
Contributors: ${context.contributors.totalUniqueAuthors} unique authors (Lead: ${context.contributors.topContributors[0]?.login || "founder"})
Milestones Count: ${context.milestones.length}

Tone requested: ${tone} (Options: storyteller = inspiring & epic; chronicle = architectural & engineering; humorous = witty indie hacker).

Output MUST be strictly valid JSON matching this schema:
{
  "title": "string",
  "subtitle": "string",
  "chapters": [
    {
      "id": "ch1",
      "title": "Chapter 1 Title",
      "timeframe": "Time period",
      "summary": "Short 1-line summary",
      "content": "Paragraph of narrative text",
      "highlightMetric": "Key metric label"
    },
    ... (total 4 chapters: Origin, Momentum, Trials/Refactors, Present Community)
  ]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);

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
    const prompt = `You are a biographer for open-source repositories. Write a 4-chapter narrative biography of:
${context.repo.full_name} (${context.languages.primaryLanguage || "Code"}).
Lifespan: ${context.metrics.lifespanFormatted}, Commits: ${context.metrics.totalCommitsAnalyzed}, Stars: ${context.repo.stargazers_count}.
Tone: ${tone}.
Return strictly JSON matching:
{ "title": string, "subtitle": string, "chapters": [{ "id": string, "title": string, "timeframe": string, "summary": string, "content": string, "highlightMetric": string }] }`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

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

    // Default zero-dependency fallback
    return this.templateEngine.generate(context, tone);
  }
}

