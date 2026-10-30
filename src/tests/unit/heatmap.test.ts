import { describe, it, expect } from "vitest";
import { computeHeatmap } from "@/lib/analytics/heatmap";
import { GitHubCommitSimple } from "@/lib/github/types";

describe("Heatmap Computation", () => {
  it("computes 168 cells for 24x7 punchcard grid", () => {
    const commits: GitHubCommitSimple[] = [
      {
        sha: "c1",
        message: "Sunday night commit",
        date: "2023-05-07T23:30:00Z", // Sunday (day 0), hour 23
        authorName: "Dev",
        authorLogin: "dev",
        authorAvatar: null,
      },
      {
        sha: "c2",
        message: "Sunday night commit 2",
        date: "2023-05-07T23:45:00Z", // Sunday (day 0), hour 23
        authorName: "Dev",
        authorLogin: "dev",
        authorAvatar: null,
      },
      {
        sha: "c3",
        message: "Monday morning commit",
        date: "2023-05-08T09:15:00Z", // Monday (day 1), hour 9
        authorName: "Dev",
        authorLogin: "dev",
        authorAvatar: null,
      },
    ];

    const result = computeHeatmap(commits);

    expect(result.punchcard.length).toBe(168);

    // Peak day should be Sunday (day 0) and peak hour should be 23
    expect(result.peakDay).toBe(0);
    expect(result.peakDayName).toBe("Sunday");
    expect(result.peakHour).toBe(23);

    const sundayCell = result.punchcard.find(
      (c) => c.dayOfWeek === 0 && c.hour === 23
    );
    expect(sundayCell?.count).toBe(2);
    expect(sundayCell?.intensity).toBe(1.0);
  });

  it("calculates 365 calendar days and GitHub-style intensity levels", () => {
    const commits: GitHubCommitSimple[] = [
      {
        sha: "c1",
        message: "today",
        date: new Date().toISOString(),
        authorName: "Dev",
        authorLogin: "dev",
        authorAvatar: null,
      },
    ];

    const result = computeHeatmap(commits);
    expect(result.calendarDays.length).toBe(365);
    expect(result.totalActiveDays).toBe(1);
    expect(result.maxDailyCommits).toBe(1);
  });
});
