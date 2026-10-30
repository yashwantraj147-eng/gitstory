import { GitHubCommitSimple, GitHubContributor } from "../github/types";
import { ContributorTimeline, ContributorTimeBucket } from "./types";

export function computeContributorTimeline(
  commits: GitHubCommitSimple[],
  rawContributors?: GitHubContributor[]
): ContributorTimeline {
  if (!commits || commits.length === 0) {
    return {
      periods: [],
      buckets: [],
      topContributors: [],
      totalUniqueAuthors: 0,
    };
  }

  // Ensure chronological order
  const sorted = [...commits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Author details map
  const authorTotals = new Map<string, {
    login: string;
    avatarUrl: string | null;
    commits: number;
    firstCommitDate: string;
    lastCommitDate: string;
  }>();

  // Create avatar lookup map from rawContributors if available
  const avatarLookup = new Map<string, string>();
  if (rawContributors) {
    for (const c of rawContributors) {
      if (c.login && c.avatar_url) {
        avatarLookup.set(c.login.toLowerCase(), c.avatar_url);
      }
    }
  }

  // Monthly buckets: YYYY-MM -> Map<author, count>
  const monthlyBuckets = new Map<string, Map<string, number>>();

  for (const c of sorted) {
    const login = (c.authorLogin || c.authorName || "Anonymous").trim();
    const avatar = c.authorAvatar || avatarLookup.get(login.toLowerCase()) || null;
    const period = c.date.slice(0, 7); // YYYY-MM

    // Update overall totals
    if (!authorTotals.has(login)) {
      authorTotals.set(login, {
        login,
        avatarUrl: avatar,
        commits: 1,
        firstCommitDate: c.date,
        lastCommitDate: c.date,
      });
    } else {
      const existing = authorTotals.get(login)!;
      existing.commits += 1;
      existing.lastCommitDate = c.date;
      if (!existing.avatarUrl && avatar) {
        existing.avatarUrl = avatar;
      }
    }

    // Update monthly bucket
    if (!monthlyBuckets.has(period)) {
      monthlyBuckets.set(period, new Map());
    }
    const monthMap = monthlyBuckets.get(period)!;
    monthMap.set(login, (monthMap.get(login) || 0) + 1);
  }

  // Sorted periods
  const periods = Array.from(monthlyBuckets.keys()).sort();

  // Calculate top contributors overall
  const topList = Array.from(authorTotals.values())
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 10);

  const totalCommitsCount = sorted.length;
  const topContributors = topList.map(item => ({
    login: item.login,
    avatarUrl: item.avatarUrl,
    totalCommits: item.commits,
    firstCommitDate: item.firstCommitDate,
    lastCommitDate: item.lastCommitDate,
    percentage: Number(((item.commits / totalCommitsCount) * 100).toFixed(1)),
  }));

  // Build cumulative race buckets across periods for top 10 authors
  const topLogins = new Set(topList.map(a => a.login));
  const cumulativeCounts = new Map<string, number>();
  const buckets: ContributorTimeBucket[] = [];

  for (const period of periods) {
    const monthMap = monthlyBuckets.get(period)!;

    for (const [author, count] of Array.from(monthMap.entries())) {
      if (topLogins.has(author)) {
        cumulativeCounts.set(author, (cumulativeCounts.get(author) || 0) + count);
      }
    }

    const currentRanks = topList.map(item => ({
      login: item.login,
      avatarUrl: item.avatarUrl,
      commits: cumulativeCounts.get(item.login) || 0,
    })).sort((a, b) => b.commits - a.commits);

    buckets.push({
      period,
      ranks: currentRanks,
    });
  }

  return {
    periods,
    buckets,
    topContributors,
    totalUniqueAuthors: authorTotals.size,
  };
}
