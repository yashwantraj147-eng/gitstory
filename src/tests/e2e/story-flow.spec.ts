import { test, expect } from "@playwright/test";

const MOCK_STORY_RESPONSE = {
  success: true,
  cached: false,
  data: {
    repo: {
      id: 1,
      name: "react",
      full_name: "facebook/react",
      description: "The library for web and native user interfaces.",
      private: false,
      html_url: "https://github.com/facebook/react",
      created_at: "2013-05-24T16:15:54Z",
      updated_at: "2026-11-01T00:00:00Z",
      pushed_at: "2026-11-01T00:00:00Z",
      stargazers_count: 230000,
      watchers_count: 230000,
      forks_count: 47000,
      open_issues_count: 850,
      language: "JavaScript",
      default_branch: "main",
      license: { key: "mit", name: "MIT License", spdx_id: "MIT" },
      owner: {
        login: "facebook",
        avatar_url: "https://avatars.githubusercontent.com/u/69631?v=4",
        html_url: "https://github.com/facebook",
        type: "Organization",
      },
    },
    metrics: {
      lifespanDays: 4900,
      lifespanFormatted: "13 yr, 5 mo",
      totalCommitsAnalyzed: 1000,
      totalCommitCountEstimate: 16500,
      commitVelocityPerMonth: 102.4,
      nightOwlPercentage: 31,
      weekendHackerPercentage: 22,
      averageCommitsPerActiveDay: 4.5,
      releasesCount: 25,
    },
    milestones: [
      {
        id: "m-genesis",
        type: "genesis",
        title: "The Genesis Commit",
        description: "Project born! Initial commit created by Jordan Walke.",
        date: "2013-05-29T00:00:00Z",
        iconName: "Sparkles",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        metadata: { sha: "abc1234", author: "Jordan Walke" },
      },
      {
        id: "m-monster",
        type: "monster_commit",
        title: "Megacommit Overhaul",
        description: "Massive code update of +2,400 / -800 lines by Dan Abramov.",
        date: "2018-10-25T00:00:00Z",
        iconName: "Zap",
        badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        metadata: { churn: 3200, sha: "def5678" },
      },
      {
        id: "m-rel",
        type: "release",
        title: "Major Milestone: Version 1.0 (v1.0.0)",
        description: "Project reached production readiness.",
        date: "2016-04-07T00:00:00Z",
        iconName: "Tag",
        badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        metadata: { tag: "v1.0.0" },
      },
    ],
    heatmap: {
      punchcard: Array.from({ length: 168 }, (_, idx) => ({
        dayOfWeek: Math.floor(idx / 24),
        hour: idx % 24,
        count: idx === 78 ? 25 : 2,
        intensity: idx === 78 ? 1 : 0.1,
      })),
      peakDay: 3,
      peakDayName: "Wednesday",
      peakHour: 18,
      peakHourLabel: "18:00 UTC",
      calendarDays: Array.from({ length: 365 }, (_, i) => ({
        date: new Date(Date.now() - (364 - i) * 86400000).toISOString().split("T")[0],
        count: i % 5 === 0 ? 4 : 0,
        level: i % 5 === 0 ? 2 : 0,
      })),
      calendarWindowLabel: "Last 52 weeks",
      startDayOfWeek: 0,
      maxDailyCommits: 12,
      totalActiveDays: 73,
      longestStreakDays: 14,
      currentStreakDays: 3,
    },
    contributors: {
      periods: ["2024-01", "2024-02"],
      buckets: [
        {
          period: "2024-01",
          ranks: [
            { login: "gaearon", avatarUrl: null, commits: 120 },
            { login: "acdlite", avatarUrl: null, commits: 95 },
          ],
        },
        {
          period: "2024-02",
          ranks: [
            { login: "acdlite", avatarUrl: null, commits: 150 },
            { login: "gaearon", avatarUrl: null, commits: 135 },
          ],
        },
      ],
      growthSeries: [
        { period: "2024-01", totalContributors: 45, totalCommits: 215, newContributors: 45 },
        { period: "2024-02", totalContributors: 62, totalCommits: 285, newContributors: 17 },
      ],
      topContributors: [
        {
          login: "acdlite",
          avatarUrl: null,
          totalCommits: 150,
          firstCommitDate: "2024-01-01",
          lastCommitDate: "2024-02-28",
          percentage: 52.6,
        },
        {
          login: "gaearon",
          avatarUrl: null,
          totalCommits: 135,
          firstCommitDate: "2024-01-01",
          lastCommitDate: "2024-02-28",
          percentage: 47.4,
        },
      ],
      totalUniqueAuthors: 62,
    },
    languages: {
      languages: [
        { name: "JavaScript", bytes: 4200000, percentage: 78.5, color: "#f1e05a" },
        { name: "TypeScript", bytes: 950000, percentage: 17.8, color: "#3178c6" },
        { name: "CSS", bytes: 200000, percentage: 3.7, color: "#563d7c" },
      ],
      primaryLanguage: "JavaScript",
      totalBytes: 5350000,
      timeline: [
        { period: "2024-01", JavaScript: 250, TypeScript: 90 },
        { period: "2024-02", JavaScript: 180, TypeScript: 210 },
      ],
      timelineLanguages: ["JavaScript", "TypeScript"],
    },
    narrative: {
      title: "The Story of react",
      subtitle: "From its first commit in 2013 to a community of 62 builders worldwide.",
      tone: "storyteller",
      generatedBy: "template",
      chapters: [
        {
          id: "ch1",
          title: "The First Spark",
          timeframe: "Born in 2013",
          summary: "A humble origin.",
          content: "In 2013, facebook initialized react.",
          highlightMetric: "Born 2013",
        },
        {
          id: "ch2",
          title: "The Rhythm of Creation",
          timeframe: "Finding the Flow",
          summary: "Peak cadence.",
          content: "Development surged on Wednesdays.",
          highlightMetric: "13 yr, 5 mo Active Lifespan",
        },
      ],
    },
    isSampled: true,
    generatedAt: "2026-11-25T10:00:00.000Z",
  },
};

test.describe("GitStory End-to-End User Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/rate-limit", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          limit: 5000,
          remaining: 4992,
          reset: Math.floor(Date.now() / 1000) + 3600,
          used: 8,
          resetTimeFormatted: "16:30:00",
        }),
      });
    });

    await page.route("**/api/story*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_STORY_RESPONSE),
      });
    });
  });

  test("validates invalid repo input and navigates via search submission", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("Every repository has a story to tell");
    const input = page.getByLabel("GitHub repository URL or owner/repo");
    await expect(input).toBeVisible();

    // Invalid input triggers accessible alert
    await input.fill("not-a-valid-repo");
    await page.getByRole("button", { name: "Explore" }).click();
    await expect(page.locator("#repo-search-error")).toContainText("valid GitHub repository");

    // Valid repo navigates to story dashboard
    await input.fill("https://github.com/facebook/react");
    await page.getByRole("button", { name: "Explore" }).click();
    await expect(page).toHaveURL(/\/story\/facebook\/react/);
    await expect(page.locator("h1")).toContainText("facebook/react");
  });

  test("renders all interactive visualizations, export modal, and wrapped mode cleanly", async ({ page }) => {
    await page.goto("/story/facebook/react");

    await expect(page.locator("h1")).toContainText("facebook/react");
    await expect(page.getByText("Megacommit Legend")).toBeVisible();

    // Tone switching works
    await page.getByRole("tab", { name: "Humorous" }).click();
    await expect(page.getByText(/Chaotic Chronicles of react/)).toBeVisible();

    // Contributor growth curve tab renders Recharts chart
    await page.getByRole("tab", { name: "Growth Curve" }).click();
    await expect(page.getByText("Cumulative Contributor Growth")).toBeVisible();

    // Heatmap punchcard tab renders hourly grid
    await page.getByRole("tab", { name: "24x7 Punchcard" }).click();
    await expect(page.getByText("UTC Timestamps")).toBeVisible();

    // Export modal opens and closes with Escape
    await page.getByRole("button", { name: "Export Card" }).click();
    await expect(page.getByRole("dialog", { name: "Share & Export GitStory" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Share & Export GitStory" })).toBeHidden();

    // Wrapped mode advances slide and toggling mute preserves current slide
    await page.getByRole("button", { name: /Launch Wrapped/i }).click();
    const wrappedDialog = page.getByRole("dialog", { name: /GITSTORY WRAPPED/i });
    await expect(wrappedDialog).toBeVisible();
    await wrappedDialog.getByRole("button", { name: "Next" }).click();
    await expect(wrappedDialog.getByText("The Vampire Shift")).toBeVisible();

    await wrappedDialog.getByRole("button", { name: /Mute Sound/i }).click();
    await expect(wrappedDialog.getByText("The Vampire Shift")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(wrappedDialog).toBeHidden();
  });
});
