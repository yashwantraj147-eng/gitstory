import { describe, it, expect } from "vitest";
import { computeContributorTimeline } from "@/lib/analytics/contributors";
import { GitHubCommitSimple } from "@/lib/github/types";

describe("Contributor Timeline, Growth Series, and Bar Race", () => {
  const commits: GitHubCommitSimple[] = [
    {
      sha: "c1",
      message: "Initial",
      date: "2023-01-01T10:00:00Z",
      authorName: "Alice",
      authorLogin: "alice",
      authorAvatar: "https://example.com/alice.png",
    },
    {
      sha: "c2",
      message: "Add feature",
      date: "2023-01-15T10:00:00Z",
      authorName: "Alice",
      authorLogin: "Alice", // Different casing should merge cleanly
      authorAvatar: "https://example.com/alice.png",
    },
    {
      sha: "c3",
      message: "Fix bug",
      date: "2023-02-05T10:00:00Z",
      authorName: "Bob",
      authorLogin: "bob",
      authorAvatar: "https://example.com/bob.png",
    },
    {
      sha: "c4",
      message: "Another fix",
      date: "2023-02-20T10:00:00Z",
      authorName: "Bob",
      authorLogin: "bob",
      authorAvatar: "https://example.com/bob.png",
    },
    {
      sha: "c5",
      message: "Bob pushes ahead",
      date: "2023-03-01T10:00:00Z",
      authorName: "Bob",
      authorLogin: "bob",
      authorAvatar: "https://example.com/bob.png",
    },
  ];

  it("calculates top contributors ranked by commit count and merges case variants", () => {
    const result = computeContributorTimeline(commits);

    expect(result.totalUniqueAuthors).toBe(2);
    expect(result.topContributors.length).toBe(2);

    expect(result.topContributors[0].login.toLowerCase()).toBe("bob");
    expect(result.topContributors[0].totalCommits).toBe(3);
    expect(result.topContributors[0].percentage).toBe(60);

    expect(result.topContributors[1].login.toLowerCase()).toBe("alice");
    expect(result.topContributors[1].totalCommits).toBe(2);
    expect(result.topContributors[1].percentage).toBe(40);
  });

  it("builds cumulative monthly buckets and growthSeries for charts", () => {
    const result = computeContributorTimeline(commits);

    expect(result.periods).toEqual(["2023-01", "2023-02", "2023-03"]);
    expect(result.buckets.length).toBe(3);
    expect(result.growthSeries).toEqual([
      { period: "2023-01", totalContributors: 1, totalCommits: 2, newContributors: 1 },
      { period: "2023-02", totalContributors: 2, totalCommits: 4, newContributors: 1 },
      { period: "2023-03", totalContributors: 2, totalCommits: 5, newContributors: 0 },
    ]);

    const m1 = result.buckets[0];
    expect(m1.period).toBe("2023-01");
    expect(m1.ranks.length).toBe(1);
    expect(m1.ranks[0].commits).toBe(2);

    const m3 = result.buckets[2];
    expect(m3.ranks[0].login.toLowerCase()).toBe("bob");
    expect(m3.ranks[0].commits).toBe(3);
  });
});
