import { describe, it, expect } from "vitest";
import { detectMilestones } from "@/lib/analytics/milestones";
import { GitHubCommitSimple, GitHubRelease } from "@/lib/github/types";

describe("Milestone Detection", () => {
  const mockCommits: GitHubCommitSimple[] = [
    {
      sha: "commit-1-genesis",
      message: "Initial commit",
      date: "2023-01-01T10:00:00Z",
      authorName: "Alice",
      authorLogin: "alice",
      authorAvatar: null,
      additions: 50,
      deletions: 0,
      totalChurn: 50,
    },
    {
      sha: "commit-2-megacommit",
      message: "Massive overhaul of the engine",
      date: "2023-01-05T12:00:00Z",
      authorName: "Bob",
      authorLogin: "bob",
      authorAvatar: null,
      additions: 1500,
      deletions: 300,
      totalChurn: 1800,
    },
    {
      sha: "commit-3-wake",
      message: "Resuming after a break",
      date: "2023-02-15T15:00:00Z", // 41 days after commit 2
      authorName: "Alice",
      authorLogin: "alice",
      authorAvatar: null,
      additions: 10,
      deletions: 2,
      totalChurn: 12,
    },
  ];

  const mockReleases: GitHubRelease[] = [
    {
      id: 1,
      tag_name: "v0.1.0",
      name: "Alpha Preview",
      published_at: "2023-01-10T00:00:00Z",
      created_at: "2023-01-10T00:00:00Z",
      html_url: "https://github.com/test/repo/releases/tag/v0.1.0",
      body: "Initial alpha release",
      prerelease: false,
    },
    {
      id: 2,
      tag_name: "v1.0.0",
      name: "Official Launch",
      published_at: "2023-03-01T00:00:00Z",
      created_at: "2023-03-01T00:00:00Z",
      html_url: "https://github.com/test/repo/releases/tag/v1.0.0",
      body: "First stable release",
      prerelease: false,
    },
  ];

  it("detects the genesis commit accurately", () => {
    const milestones = detectMilestones(mockCommits, []);
    const genesis = milestones.find((m) => m.type === "genesis");

    expect(genesis).toBeDefined();
    expect(genesis?.title).toBe("The Genesis Commit");
    expect(genesis?.description).toContain("Alice");
    expect(genesis?.metadata?.sha).toBe("commit-");
  });

  it("detects monster commit with high additions/deletions", () => {
    const milestones = detectMilestones(mockCommits, []);
    const monster = milestones.find((m) => m.type === "monster_commit");

    expect(monster).toBeDefined();
    expect(monster?.title).toBe("Megacommit Overhaul");
    expect(monster?.description).toContain("Bob");
    expect(monster?.metadata?.churn).toBe(1800);
  });

  it("detects long slumber between commits", () => {
    const milestones = detectMilestones(mockCommits, []);
    const slumber = milestones.find((m) => m.type === "slumber");

    expect(slumber).toBeDefined();
    expect(slumber?.title).toContain("41 Days");
    expect(slumber?.metadata?.gapDays).toBe(41);
  });

  it("detects first release and v1.0 release", () => {
    const milestones = detectMilestones(mockCommits, mockReleases);
    const firstRel = milestones.find((m) => m.id.includes("v0.1.0"));
    const v1Rel = milestones.find((m) => m.id.includes("v1.0.0"));

    expect(firstRel).toBeDefined();
    expect(firstRel?.title).toContain("First Public Release");
    expect(v1Rel).toBeDefined();
    expect(v1Rel?.title).toContain("Version 1.0");
  });

  it("handles empty commits gracefully without errors", () => {
    const milestones = detectMilestones([], []);
    expect(milestones).toEqual([]);
  });
});

