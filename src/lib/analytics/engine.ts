import { RawRepoBundle } from "../github/types";
import { RepoStoryPayload, RepoStoryMetrics } from "./types";
import { detectMilestones } from "./milestones";
import { computeHeatmap } from "./heatmap";
import { computeContributorTimeline } from "./contributors";
import { computeLanguages } from "./languages";
import { TemplateNarrativeEngine } from "../narrative/templateEngine";

function formatLifespan(days: number): string {
  if (days < 30) {
    return `${days} days`;
  }
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  const months = Math.floor(remainingDays / 30);

  if (years > 0) {
    return months > 0 ? `${years} yr, ${months} mo` : `${years} year${years > 1 ? "s" : ""}`;
  }
  return `${months} month${months > 1 ? "s" : ""}`;
}

export function generateRepoStory(bundle: RawRepoBundle): RepoStoryPayload {
  const { repo, commits, releases, contributors, languages, isSampled } = bundle;

  // 1. Calculate time spans and metrics
  const sortedCommits = [...commits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstCommitDate = sortedCommits.length > 0 ? new Date(sortedCommits[0].date) : new Date(repo.created_at);
  const lastCommitDate = sortedCommits.length > 0 ? new Date(sortedCommits[sortedCommits.length - 1].date) : new Date(repo.pushed_at);

  const diffMs = Math.max(0, lastCommitDate.getTime() - firstCommitDate.getTime());
  const lifespanDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const lifespanFormatted = formatLifespan(lifespanDays);

  // Commits per month velocity
  const lifespanMonths = Math.max(0.5, lifespanDays / 30.4);
  const commitVelocityPerMonth = Number((commits.length / lifespanMonths).toFixed(1));

  // Night owl (22:00 - 05:00 UTC) vs weekend hacker (Saturday/Sunday)
  let nightCommits = 0;
  let weekendCommits = 0;
  const activeDaysSet = new Set<string>();

  for (const c of commits) {
    const d = new Date(c.date);
    const hour = d.getUTCHours();
    const day = d.getUTCDay();

    if (hour >= 22 || hour <= 5) {
      nightCommits++;
    }
    if (day === 0 || day === 6) {
      weekendCommits++;
    }

    activeDaysSet.add(d.toISOString().split("T")[0]);
  }

  const totalCommits = Math.max(1, commits.length);
  const nightOwlPercentage = Math.round((nightCommits / totalCommits) * 100);
  const weekendHackerPercentage = Math.round((weekendCommits / totalCommits) * 100);

  const totalActiveDays = Math.max(1, activeDaysSet.size);
  const averageCommitsPerActiveDay = Number((commits.length / totalActiveDays).toFixed(1));

  const metrics: RepoStoryMetrics = {
    lifespanDays,
    lifespanFormatted,
    totalCommitsAnalyzed: commits.length,
    commitVelocityPerMonth,
    nightOwlPercentage,
    weekendHackerPercentage,
    averageCommitsPerActiveDay,
    releasesCount: releases.length,
  };

  // 2. Compute submodules
  const detectedMilestones = detectMilestones(commits, releases);
  const computedHeatmap = computeHeatmap(commits);
  const computedContributors = computeContributorTimeline(commits, contributors);
  const computedLanguages = computeLanguages(languages);

  // 3. Generate initial narrative via template engine
  const templateEngine = new TemplateNarrativeEngine();
  const narrative = templateEngine.generate({
    repo,
    metrics,
    milestones: detectedMilestones,
    heatmap: computedHeatmap,
    contributors: computedContributors,
    languages: computedLanguages,
  }, "storyteller");

  return {
    repo,
    metrics,
    milestones: detectedMilestones,
    heatmap: computedHeatmap,
    contributors: computedContributors,
    languages: computedLanguages,
    narrative,
    isSampled,
    generatedAt: new Date().toISOString(),
  };
}

