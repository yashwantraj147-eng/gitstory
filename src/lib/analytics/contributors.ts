import { GitHubCommitSimple, GitHubContributor } from "../github/types";
import { ContributorTimeline, ContributorTimeBucket, ContributorGrowthPoint } from "./types";

export interface ComputeContributorOptions {
  isSampled?: boolean;
}

export function computeContributorTimeline(
  commits: GitHubCommitSimple[],
  rawContributors?: GitHubContributor[],
  options?: ComputeContributorOptions
): ContributorTimeline {
  if (!commits || commits.length === 0) {
    return {
      periods: [],
      buckets: [],
      growthSeries: [],
      topContributors: [],
      totalUniqueAuthors: 0,
    };
  }

  // Ensure chronological order
  const sorted = [...commits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const authorTotals = new Map<
    string,
    {
      login: string;
      avatarUrl: string | null;
      commits: number;
      firstCommitDate: string;
      lastCommitDate: string;
    }
  >();

  // Create avatar lookup map from rawContributors if available
  const avatarLookup = new Map<string, string>();
  const loginLookup = new Map<string, string>();
  if (rawContributors) {
    for (const c of rawContributors) {
      if (c.login) {
        loginLookup.set(c.login.toLowerCase(), c.login);
        if (c.avatar_url) {
          avatarLookup.set(c.login.toLowerCase(), c.avatar_url);
        }
      }
    }
  }

  // Monthly buckets: YYYY-MM -> Map<normalizedAuthorKey, count>
  const monthlyBuckets = new Map<string, Map<string, number>>();

  for (const c of sorted) {
    const rawName = (c.authorLogin || c.authorName || "Anonymous").trim();
    const authorKey = rawName.toLowerCase();
    const displayLogin = loginLookup.get(authorKey) || rawName;
    const avatar = c.authorAvatar || avatarLookup.get(authorKey) || null;
    const period = c.date.slice(0, 7); // YYYY-MM

    if (!authorTotals.has(authorKey)) {
      authorTotals.set(authorKey, {
        login: displayLogin,
        avatarUrl: avatar,
        commits: 1,
        firstCommitDate: c.date,
        lastCommitDate: c.date,
      });
    } else {
      const existing = authorTotals.get(authorKey)!;
      existing.commits += 1;
      existing.lastCommitDate = c.date;
      if (!existing.avatarUrl && avatar) {
        existing.avatarUrl = avatar;
      }
      if (c.authorLogin && existing.login !== c.authorLogin) {
        existing.login = c.authorLogin;
      }
    }

    if (!monthlyBuckets.has(period)) {
      monthlyBuckets.set(period, new Map());
    }
    const monthMap = monthlyBuckets.get(period)!;
    monthMap.set(authorKey, (monthMap.get(authorKey) || 0) + 1);
  }

  const periods = Array.from(monthlyBuckets.keys()).sort();

  // Build cumulative race buckets (top 10 active up to each period) and growth series
  const cumulativeCounts = new Map<string, number>();
  const seenContributors = new Set<string>();
  const buckets: ContributorTimeBucket[] = [];
  const growthSeries: ContributorGrowthPoint[] = [];
  let runningCommits = 0;

  for (const period of periods) {
    const monthMap = monthlyBuckets.get(period)!;
    let newInPeriod = 0;

    for (const [authorKey, count] of Array.from(monthMap.entries())) {
      runningCommits += count;
      if (!seenContributors.has(authorKey)) {
        seenContributors.add(authorKey);
        newInPeriod += 1;
      }
      cumulativeCounts.set(authorKey, (cumulativeCounts.get(authorKey) || 0) + count);
    }

    const currentRanks = Array.from(cumulativeCounts.entries())
      .map(([authorKey, commitsCount]) => {
        const meta = authorTotals.get(authorKey)!;
        return {
          login: meta.login,
          avatarUrl: meta.avatarUrl,
          commits: commitsCount,
        };
      })
      .sort((a, b) => b.commits - a.commits || a.login.localeCompare(b.login))
      .slice(0, 10);

    buckets.push({
      period,
      ranks: currentRanks,
    });

    growthSeries.push({
      period,
      totalContributors: seenContributors.size,
      totalCommits: runningCommits,
      newContributors: newInPeriod,
    });
  }

  // On sampled repos, enrich Hall of Fame with GitHub's aggregated contributor totals when available
  if (options?.isSampled && rawContributors && rawContributors.length > 0) {
    const totalContribSum = Math.max(
      1,
      rawContributors.reduce((sum, item) => sum + item.contributions, 0)
    );
    const topFromApi = [...rawContributors]
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 10)
      .map((item) => {
        const local = authorTotals.get(item.login.toLowerCase());
        return {
          login: item.login,
          avatarUrl: item.avatar_url || local?.avatarUrl || null,
          totalCommits: item.contributions,
          firstCommitDate: local?.firstCommitDate || sorted[0].date,
          lastCommitDate: local?.lastCommitDate || sorted[sorted.length - 1].date,
          percentage: Number(((item.contributions / totalContribSum) * 100).toFixed(1)),
        };
      });

    return {
      periods,
      buckets,
      growthSeries,
      topContributors: topFromApi,
      totalUniqueAuthors: Math.max(authorTotals.size, rawContributors.length),
    };
  }

  const topList = Array.from(authorTotals.values())
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 10);

  const totalCommitsCount = sorted.length;
  const topContributors = topList.map((item) => ({
    login: item.login,
    avatarUrl: item.avatarUrl,
    totalCommits: item.commits,
    firstCommitDate: item.firstCommitDate,
    lastCommitDate: item.lastCommitDate,
    percentage: Number(((item.commits / totalCommitsCount) * 100).toFixed(1)),
  }));

  return {
    periods,
    buckets,
    growthSeries,
    topContributors,
    totalUniqueAuthors: authorTotals.size,
  };
}
