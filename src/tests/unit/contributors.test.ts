import { describe, it, expect } from "vitest";
import { computeContributorTimeline } from "@/lib/analytics/contributors";
import { GitHubCommitSimple } from "@/lib/github/types";

describe("Contributor Timeline and Bar Race", () => {
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
      authorLogin: "alice",
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

  it("calculates top contributors ranked by commit count", () => {
    const result = computeContributorTimeline(commits);

    expect(result.totalUniqueAuthors).toBe(2);
    expect(result.topContributors.length).toBe(2);

    // Bob has 3 commits (60%), Alice has 2 commits (40%)
    expect(result.topContributors[0].login).toBe("bob");
    expect(result.topContributors[0].totalCommits).toBe(3);
    expect(result.topContributors[0].percentage).toBe(60);

    expect(result.topContributors[1].login).toBe("alice");
    expect(result.topContributors[1].totalCommits).toBe(2);
    expect(result.topContributors[1].percentage).toBe(40);
  });

  it("builds cumulative monthly buckets for animated race chart", () => {
    const result = computeContributorTimeline(commits);

    expect(result.periods).toEqual(["2023-01", "2023-02", "2023-03"]);
    expect(result.buckets.length).toBe(3);

    // Month 1 (2023-01): Alice has 2, Bob has 0
    const m1 = result.buckets[0];
    expect(m1.period).toBe("2023-01");
    const m1Alice = m1.ranks.find((r) => r.login === "alice");
    const m1Bob = m1.ranks.find((r) => r.login === "bob");
    expect(m1Alice?.commits).toBe(2);
    expect(m1Bob?.commits).toBe(0);

    // Month 2 (2023-02): Alice has 2, Bob has 2
    const m2 = result.buckets[1];
    const m2Alice = m2.ranks.find((r) => r.login === "alice");
    const m2Bob = m2.ranks.find((r) => r.login === "bob");
    expect(m2Alice?.commits).toBe(2);
    expect(m2Bob?.commits).toBe(2);

    // Month 3 (2023-03): Bob has 3, Alice has 2
    const m3 = result.buckets[2];
    const m3Bob = m3.ranks.find((r) => r.login === "bob");
    const m3Alice = m3.ranks.find((r) => r.login === "alice");
    expect(m3Bob?.commits).toBe(3);
    expect(m3Alice?.commits).toBe(2);
  });
});
