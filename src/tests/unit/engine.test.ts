import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { generateRepoStory } from "@/lib/analytics/engine";
import { computeLanguages } from "@/lib/analytics/languages";
import { GET as getStoryRoute } from "@/app/api/story/route";
import { RawRepoBundle } from "@/lib/github/types";

describe("Analytics Engine, Language Timeline & API Route Validation", () => {
  const sampleBundle: RawRepoBundle = {
    repo: {
      id: 42,
      name: "gitstory-demo",
      full_name: "acme/gitstory-demo",
      description: "Demo project",
      private: false,
      html_url: "https://github.com/acme/gitstory-demo",
      created_at: "2021-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      pushed_at: "2024-01-01T00:00:00Z",
      stargazers_count: 500,
      watchers_count: 500,
      forks_count: 45,
      open_issues_count: 3,
      language: "TypeScript",
      default_branch: "main",
      license: { key: "mit", name: "MIT License", spdx_id: "MIT" },
      owner: {
        login: "acme",
        avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
        html_url: "https://github.com/acme",
        type: "Organization",
      },
    },
    commits: [
      {
        sha: "aaa1111",
        message: "Initial setup",
        date: "2021-01-01T12:00:00Z",
        authorName: "Alice",
        authorLogin: "alice",
        authorAvatar: null,
        files: [{ filename: "src/index.ts", additions: 50, deletions: 0, changes: 50 }],
      },
      {
        sha: "bbb2222",
        message: "Add styles",
        date: "2021-02-01T12:00:00Z",
        authorName: "Alice",
        authorLogin: "alice",
        authorAvatar: null,
        files: [{ filename: "src/app.css", additions: 25, deletions: 5, changes: 30 }],
      },
    ],
    releases: [],
    contributors: [],
    languages: { TypeScript: 8000, CSS: 2000 },
    isSampled: false,
    totalCommitCountEstimate: 2,
    fetchedAt: "2024-01-01T00:00:00Z",
  };

  it("computes language snapshot percentages and file-type timeline from commits", () => {
    const langs = computeLanguages(sampleBundle.languages, sampleBundle.commits);

    expect(langs.primaryLanguage).toBe("TypeScript");
    expect(langs.languages[0].percentage).toBe(80);
    expect(langs.timeline?.length).toBe(2);
    expect(langs.timeline?.[0]).toEqual({ period: "2021-01", TypeScript: 50, CSS: 0 });
    expect(langs.timeline?.[1]).toEqual({ period: "2021-02", TypeScript: 0, CSS: 30 });
  });

  it("generates complete RepoStoryPayload with singular lifespan formatting when 1 day", () => {
    const singleDayBundle: RawRepoBundle = {
      ...sampleBundle,
      repo: { ...sampleBundle.repo, created_at: "2024-01-01T00:00:00Z" },
      commits: [
        {
          ...sampleBundle.commits[0],
          date: "2024-01-01T12:00:00Z",
        },
      ],
      totalCommitCountEstimate: 1,
    };

    const story = generateRepoStory(singleDayBundle);
    expect(story.metrics.lifespanDays).toBe(1);
    expect(story.metrics.lifespanFormatted).toBe("1 day");
    expect(story.narrative.chapters.length).toBe(4);
  });

  it("rejects missing repo and non-numeric maxCommits parameters in /api/story", async () => {
    const missingReq = new NextRequest("http://localhost:3000/api/story");
    const missingRes = await getStoryRoute(missingReq);
    expect(missingRes.status).toBe(400);

    const badMaxReq = new NextRequest("http://localhost:3000/api/story?repo=facebook/react&maxCommits=abc");
    const badMaxRes = await getStoryRoute(badMaxReq);
    expect(badMaxRes.status).toBe(400);
    const body = (await badMaxRes.json()) as { error: string };
    expect(body.error).toContain("maxCommits");
  });
});
