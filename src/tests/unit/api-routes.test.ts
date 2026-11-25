import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getStoryRoute } from "@/app/api/story/route";
import { GET as getRateLimitRoute } from "@/app/api/rate-limit/route";
import { POST as postNarrativeRoute } from "@/app/api/narrative/route";
import { GeminiNarrativeProvider, OpenAINarrativeProvider } from "@/lib/narrative/llmProvider";
import { NarrativeContext } from "@/lib/narrative/types";
import { repoCache } from "@/lib/github/cache";

const mockContext: NarrativeContext = {
  repo: {
    id: 1,
    name: "gitstory",
    full_name: "acme/gitstory",
    description: "Repo storyteller",
    private: false,
    html_url: "https://github.com/acme/gitstory",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    pushed_at: "2026-01-01T00:00:00Z",
    stargazers_count: 1200,
    watchers_count: 1200,
    forks_count: 90,
    open_issues_count: 2,
    language: "TypeScript",
    default_branch: "main",
    license: { key: "mit", name: "MIT License", spdx_id: "MIT" },
    owner: { login: "acme", avatar_url: "", html_url: "", type: "Organization" },
  },
  metrics: {
    lifespanDays: 1000,
    lifespanFormatted: "2 yr, 9 mo",
    totalCommitsAnalyzed: 200,
    totalCommitCountEstimate: 200,
    commitVelocityPerMonth: 6.1,
    nightOwlPercentage: 20,
    weekendHackerPercentage: 15,
    averageCommitsPerActiveDay: 2.0,
    releasesCount: 4,
  },
  milestones: [],
  heatmap: {
    punchcard: [],
    peakDay: 2,
    peakDayName: "Tuesday",
    peakHour: 14,
    peakHourLabel: "14:00 UTC",
    calendarDays: [],
    maxDailyCommits: 8,
    totalActiveDays: 100,
    longestStreakDays: 10,
    currentStreakDays: 2,
  },
  contributors: {
    periods: ["2023-01"],
    buckets: [],
    growthSeries: [],
    topContributors: [
      {
        login: "alice",
        avatarUrl: null,
        totalCommits: 120,
        firstCommitDate: "2023-01-01",
        lastCommitDate: "2026-01-01",
        percentage: 60,
      },
    ],
    totalUniqueAuthors: 5,
  },
  languages: {
    languages: [{ name: "TypeScript", bytes: 50000, percentage: 100, color: "#3178c6" }],
    primaryLanguage: "TypeScript",
    totalBytes: 50000,
  },
};

describe("API Routes & LLM Narrative Providers", () => {
  beforeEach(() => {
    repoCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates GeminiNarrativeProvider and OpenAINarrativeProvider JSON parsing and rejects malformed responses", async () => {
    const validLlmJson = {
      title: "AI Story Title",
      subtitle: "AI Subtitle",
      chapters: [
        {
          id: "ch1",
          title: "Origin",
          timeframe: "2023",
          summary: "Born",
          content: "Started in 2023.",
          highlightMetric: "1,200 Stars",
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(validLlmJson) }] } }],
        }),
        { status: 200 }
      )
    );
    const gemini = new GeminiNarrativeProvider("fake-gemini-key");
    const geminiResult = await gemini.generateNarrative(mockContext, "chronicle");
    expect(geminiResult.generatedBy).toBe("ai");
    expect(geminiResult.tone).toBe("chronicle");
    expect(geminiResult.title).toBe("AI Story Title");

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ title: "Broken" }) } }],
        }),
        { status: 200 }
      )
    );
    const openai = new OpenAINarrativeProvider("fake-openai-key");
    await expect(openai.generateNarrative(mockContext)).rejects.toThrow("invalid narrative JSON shape");
  });

  it("handles /api/story cache MISS, cache HIT, and 404 errors", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "https://api.github.com/repos/acme/story") {
        return new Response(JSON.stringify(mockContext.repo), { status: 200 });
      }
      if (url.includes("/commits?per_page=100&page=1")) {
        return new Response(
          JSON.stringify([
            {
              sha: "abc1234",
              commit: {
                author: { name: "Alice", email: "a@acme.dev", date: "2023-01-01T10:00:00Z" },
                message: "init",
              },
              author: { login: "alice", id: 1, avatar_url: "", html_url: "" },
              html_url: "",
            },
          ]),
          { status: 200 }
        );
      }
      if (url.includes("/commits/abc1234")) {
        return new Response(
          JSON.stringify({
            sha: "abc1234",
            commit: {
              author: { name: "Alice", email: "a@acme.dev", date: "2023-01-01T10:00:00Z" },
              message: "init",
            },
            author: null,
            html_url: "",
            stats: { total: 20, additions: 20, deletions: 0 },
            files: [{ filename: "index.ts", additions: 20, deletions: 0, changes: 20 }],
          }),
          { status: 200 }
        );
      }
      if (url.endsWith("/languages")) {
        return new Response(JSON.stringify({ TypeScript: 5000 }), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const req1 = new NextRequest("http://localhost:3000/api/story?repo=acme/story");
    const res1 = await getStoryRoute(req1);
    expect(res1.status).toBe(200);
    expect(res1.headers.get("x-gitstory-cache")).toBe("MISS");

    const req2 = new NextRequest("http://localhost:3000/api/story?repo=acme/story");
    const res2 = await getStoryRoute(req2);
    expect(res2.status).toBe(200);
    expect(res2.headers.get("x-gitstory-cache")).toBe("HIT");

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Not Found" }), { status: 404 })
    );
    const notFoundReq = new NextRequest("http://localhost:3000/api/story?repo=acme/missing");
    const notFoundRes = await getStoryRoute(notFoundReq);
    expect(notFoundRes.status).toBe(404);
  });

  it("handles /api/rate-limit and /api/narrative POST validation", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ resources: { core: { limit: 60, remaining: 42, reset: 1800000000, used: 18 } } }),
        { status: 200 }
      )
    );
    const rateRes = await getRateLimitRoute();
    expect(rateRes.status).toBe(200);
    const rateJson = (await rateRes.json()) as { remaining: number };
    expect(rateJson.remaining).toBe(42);

    const invalidNarrativeReq = new NextRequest("http://localhost:3000/api/narrative", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const invalidRes = await postNarrativeRoute(invalidNarrativeReq);
    expect(invalidRes.status).toBe(400);

    const validNarrativeReq = new NextRequest("http://localhost:3000/api/narrative", {
      method: "POST",
      body: JSON.stringify({ context: mockContext, tone: "humorous" }),
    });
    const validRes = await postNarrativeRoute(validNarrativeReq);
    expect(validRes.status).toBe(200);
    const validBody = (await validRes.json()) as { data: { tone: string; generatedBy: string } };
    expect(validBody.data.tone).toBe("humorous");
    expect(validBody.data.generatedBy).toBe("template");
  });
});
