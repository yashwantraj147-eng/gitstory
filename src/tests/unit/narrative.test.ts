import { describe, it, expect } from "vitest";
import { TemplateNarrativeEngine } from "@/lib/narrative/templateEngine";
import { PluggableNarrativeGenerator } from "@/lib/narrative/llmProvider";
import { NarrativeContext } from "@/lib/narrative/types";

describe("Narrative Engine & Fallback", () => {
  const mockContext: NarrativeContext = {
    repo: {
      id: 1,
      name: "awesome-framework",
      full_name: "acme/awesome-framework",
      description: "A fast framework for web apps",
      private: false,
      html_url: "https://github.com/acme/awesome-framework",
      created_at: "2020-04-10T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      pushed_at: "2024-01-01T00:00:00Z",
      stargazers_count: 14500,
      watchers_count: 14500,
      forks_count: 1200,
      open_issues_count: 42,
      language: "TypeScript",
      default_branch: "main",
      license: { key: "mit", name: "MIT License", spdx_id: "MIT" },
      owner: {
        login: "acme",
        avatar_url: "https://example.com/avatar.png",
        html_url: "https://github.com/acme",
        type: "Organization",
      },
    },
    metrics: {
      lifespanDays: 1360,
      lifespanFormatted: "3 yr, 8 mo",
      totalCommitsAnalyzed: 850,
      commitVelocityPerMonth: 18.5,
      nightOwlPercentage: 35,
      weekendHackerPercentage: 28,
      averageCommitsPerActiveDay: 3.2,
      releasesCount: 15,
    },
    milestones: [
      {
        id: "m1",
        type: "genesis",
        title: "The Genesis Commit",
        description: "Initial commit",
        date: "2020-04-10T00:00:00Z",
        iconName: "Sparkles",
        badgeColor: "bg-emerald-500",
      },
    ],
    heatmap: {
      punchcard: [],
      peakDay: 3,
      peakDayName: "Wednesday",
      peakHour: 22,
      peakHourLabel: "22:00 UTC",
      calendarDays: [],
      maxDailyCommits: 14,
      totalActiveDays: 260,
      longestStreakDays: 12,
      currentStreakDays: 0,
    },
    contributors: {
      periods: ["2020-04", "2020-05"],
      buckets: [],
      topContributors: [
        {
          login: "founder",
          avatarUrl: null,
          totalCommits: 500,
          firstCommitDate: "2020-04-10",
          lastCommitDate: "2023-12-01",
          percentage: 58.8,
        },
      ],
      totalUniqueAuthors: 34,
    },
    languages: {
      languages: [
        { name: "TypeScript", bytes: 500000, percentage: 85, color: "#3178c6" },
        { name: "CSS", bytes: 88000, percentage: 15, color: "#563d7c" },
      ],
      primaryLanguage: "TypeScript",
      totalBytes: 588000,
    },
  };

  it("generates a 4-chapter narrative in storyteller tone", () => {
    const engine = new TemplateNarrativeEngine();
    const result = engine.generate(mockContext, "storyteller");

    expect(result.tone).toBe("storyteller");
    expect(result.chapters.length).toBe(4);
    expect(result.title).toContain("awesome-framework");
    expect(result.chapters[0].content).toContain("2020");
  });

  it("generates a witty narrative in humorous tone", () => {
    const engine = new TemplateNarrativeEngine();
    const result = engine.generate(mockContext, "humorous");

    expect(result.tone).toBe("humorous");
    expect(result.title).toContain("Chaotic Chronicles");
    expect(result.chapters[1].content).toContain("vampire hours");
  });

  it("generates architectural chronicle in chronicle tone", () => {
    const engine = new TemplateNarrativeEngine();
    const result = engine.generate(mockContext, "chronicle");

    expect(result.tone).toBe("chronicle");
    expect(result.title).toContain("Technical Chronicle");
    expect(result.chapters[0].content).toContain("TypeScript");
  });

  it("gracefully falls back to template when no LLM keys are present", async () => {
    const generator = new PluggableNarrativeGenerator();
    const result = await generator.generate(mockContext);

    expect(result).toBeDefined();
    expect(result.chapters.length).toBe(4);
    expect(result.generatedBy).toBe("template");
  });
});

