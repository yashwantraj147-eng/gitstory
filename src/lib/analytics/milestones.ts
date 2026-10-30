import { GitHubCommitSimple, GitHubRelease } from "../github/types";
import { Milestone } from "./types";

export function detectMilestones(
  commits: GitHubCommitSimple[],
  releases: GitHubRelease[]
): Milestone[] {
  const milestones: Milestone[] = [];

  if (!commits || commits.length === 0) {
    return milestones;
  }

  // Ensure chronological order (oldest first)
  const sorted = [...commits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 1. Genesis Milestone
  const first = sorted[0];
  milestones.push({
    id: `milestone-genesis-${first.sha.slice(0, 7)}`,
    type: "genesis",
    title: "The Genesis Commit",
    description: `Project born! Initial commit created by ${first.authorName || first.authorLogin || "founder"}: "${first.message.split("\n")[0].slice(0, 80)}"`,
    date: first.date,
    iconName: "Sparkles",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    metadata: {
      sha: first.sha.slice(0, 7),
      author: first.authorName || first.authorLogin || "Founder",
    },
  });

  // 2. Numerical Milestones (100th, 500th, 1,000th commit)
  const thresholds = [100, 500, 1000, 5000];
  for (const t of thresholds) {
    if (sorted.length >= t) {
      const c = sorted[t - 1];
      milestones.push({
        id: `milestone-commit-${t}`,
        type: "century",
        title: `${t.toLocaleString()}th Commit Reached`,
        description: `Project hit milestone #${t} committed by ${c.authorName || c.authorLogin || "contributor"}.`,
        date: c.date,
        iconName: "Trophy",
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        metadata: {
          commitNumber: t,
          sha: c.sha.slice(0, 7),
        },
      });
    }
  }

  // 3. The Long Slumber (Longest inactivity gap >= 14 days)
  let longestGapMs = 0;
  let gapEndDate = "";
  let gapDays = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].date).getTime();
    const currDate = new Date(sorted[i].date).getTime();
    const diffMs = currDate - prevDate;

    if (diffMs > longestGapMs) {
      longestGapMs = diffMs;
      gapEndDate = sorted[i].date;
      gapDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
  }

  if (gapDays >= 14) {
    milestones.push({
      id: "milestone-long-slumber",
      type: "slumber",
      title: `The Great Hibernation (${gapDays} Days)`,
      description: `Development paused for ${gapDays} days of radio silence before breaking into active work again.`,
      date: gapEndDate,
      iconName: "Moon",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      metadata: {
        gapDays,
      },
    });
  }

  // 4. The Golden Era (Highest commits in a 7-day rolling window)
  if (sorted.length >= 10) {
    let max7DayCount = 0;
    let goldenEraDate = "";
    const msIn7Days = 7 * 24 * 60 * 60 * 1000;

    let left = 0;
    for (let right = 0; right < sorted.length; right++) {
      const rightTime = new Date(sorted[right].date).getTime();
      while (rightTime - new Date(sorted[left].date).getTime() > msIn7Days) {
        left++;
      }
      const countInWindow = right - left + 1;
      if (countInWindow > max7DayCount) {
        max7DayCount = countInWindow;
        goldenEraDate = sorted[right].date;
      }
    }

    if (max7DayCount >= 8) {
      milestones.push({
        id: "milestone-golden-era",
        type: "golden_era",
        title: "Sprint of Fire (Peak Velocity)",
        description: `Highest intensity week recorded: ${max7DayCount} commits pushed in a single 7-day streak!`,
        date: goldenEraDate,
        iconName: "Flame",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        metadata: {
          commitCount: max7DayCount,
        },
      });
    }
  }

  // 5. Monster Commit (Commit with largest recorded churn or longest message)
  let maxChurnCommit: GitHubCommitSimple | null = null;
  let maxChurn = 0;
  for (const c of sorted) {
    const churn = (c.additions ?? 0) + (c.deletions ?? 0);
    if (churn > maxChurn) {
      maxChurn = churn;
      maxChurnCommit = c;
    }
  }

  if (maxChurnCommit && maxChurn > 100) {
    milestones.push({
      id: `milestone-monster-${maxChurnCommit.sha.slice(0, 7)}`,
      type: "monster_commit",
      title: "Megacommit Overhaul",
      description: `Massive code update of +${(maxChurnCommit.additions ?? 0).toLocaleString()} / -${(maxChurnCommit.deletions ?? 0).toLocaleString()} lines by ${maxChurnCommit.authorName}.`,
      date: maxChurnCommit.date,
      iconName: "Zap",
      badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      metadata: {
        churn: maxChurn,
        sha: maxChurnCommit.sha.slice(0, 7),
      },
    });
  }

  // 6. Release Milestones
  if (releases && releases.length > 0) {
    const sortedReleases = [...releases].filter(r => r.published_at || r.created_at).sort(
      (a, b) => new Date(a.published_at || a.created_at).getTime() - new Date(b.published_at || b.created_at).getTime()
    );

    // First Release
    const firstRel = sortedReleases[0];
    milestones.push({
      id: `milestone-rel-first-${firstRel.tag_name}`,
      type: "release",
      title: `First Public Release: ${firstRel.tag_name}`,
      description: firstRel.name && firstRel.name !== firstRel.tag_name ? `${firstRel.name} (${firstRel.tag_name})` : `Official initial release tagged on GitHub.`,
      date: firstRel.published_at || firstRel.created_at,
      iconName: "Tag",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      metadata: {
        tag: firstRel.tag_name,
      },
    });

    // Check for v1.0.0 (exact major 1.0 tag)
    const v1 = sortedReleases.find(r => /^v?1\.0(\.0)?$/i.test(r.tag_name));
    if (v1 && v1.tag_name !== firstRel.tag_name) {
      milestones.push({
        id: `milestone-rel-v1-${v1.tag_name}`,
        type: "release",
        title: `Major Milestone: Version 1.0 (${v1.tag_name})`,
        description: "Project reached production readiness and API maturity with version 1.0.",
        date: v1.published_at || v1.created_at,
        iconName: "Trophy",
        badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        metadata: {
          tag: v1.tag_name,
        },
      });
    }

    // Latest Release (if different from first and v1)
    if (sortedReleases.length > 1) {
      const latestRel = sortedReleases[sortedReleases.length - 1];
      if (latestRel.tag_name !== firstRel.tag_name && latestRel.tag_name !== v1?.tag_name) {
        milestones.push({
          id: `milestone-rel-latest-${latestRel.tag_name}`,
          type: "release",
          title: `Current Release: ${latestRel.tag_name}`,
          description: `Latest public release shipping features and fixes.`,
          date: latestRel.published_at || latestRel.created_at,
          iconName: "Tag",
          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          metadata: {
            tag: latestRel.tag_name,
          },
        });
      }
    }
  }

  // 7. Community Growth Milestones (10th, 25th contributor joins)
  const seenAuthors = new Set<string>();
  let tenthContributorDate: string | null = null;
  let twentyFifthDate: string | null = null;

  for (const c of sorted) {
    const authorKey = c.authorLogin || c.authorName;
    if (!seenAuthors.has(authorKey)) {
      seenAuthors.add(authorKey);
      if (seenAuthors.size === 10 && !tenthContributorDate) {
        tenthContributorDate = c.date;
      }
      if (seenAuthors.size === 25 && !twentyFifthDate) {
        twentyFifthDate = c.date;
      }
    }
  }

  if (tenthContributorDate) {
    milestones.push({
      id: "milestone-contrib-10",
      type: "contributor_boom",
      title: "Community Expansion: 10 Contributors",
      description: "A thriving open-source community: the repository welcomed its 10th distinct code contributor.",
      date: tenthContributorDate,
      iconName: "Users",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      metadata: {
        contributors: 10,
      },
    });
  }

  if (twentyFifthDate) {
    milestones.push({
      id: "milestone-contrib-25",
      type: "contributor_boom",
      title: "Ecosystem Growth: 25 Contributors",
      description: "Major community adoption reached with 25 distinct engineers committing code.",
      date: twentyFifthDate,
      iconName: "Users",
      badgeColor: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
      metadata: {
        contributors: 25,
      },
    });
  }

  // Sort all detected milestones chronologically
  milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return milestones;
}
