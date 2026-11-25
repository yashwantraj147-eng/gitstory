import { RawRepoBundle } from "../github/types";
import { RepoStoryPayload, RepoStoryMetrics } from "./types";
import { detectMilestones } from "./milestones";
import { computeHeatmap } from "./heatmap";
import { computeContributorTimeline } from "./contributors";
import { computeLanguages } from "./languages";
import { TemplateNarrativeEngine } from "../narrative/templateEngine";
import { PluggableNarrativeGenerator } from "../narrative/llmProvider";
import { NarrativeTone } from "../narrative/types";

function formatLifespan(days: number): string {
  if (days < 30) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  const months = Math.floor(remainingDays / 30);

  if (years > 0) {
    return months > 0 ? `${years} yr, ${months} mo` : `${years} year${years > 1 ? "s" : ""}`;
  }
  return `${months} month${months > 1 ? "s" : ""}`;
}

function buildStoryBase(bundle: RawRepoBundle) {
  const { repo, commits, genesisCommit, releases, contributors, languages, isSampled, totalCommitCountEstimate } = bundle;

  const sortedCommits = [...commits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const repoCreatedDate = new Date(repo.created_at);
  const earliestSampledDate = sortedCommits.length > 0 ? new Date(sortedCommits[0].date) : repoCreatedDate;
  const genesisDate = genesisCommit ? new Date(genesisCommit.date) : earliestSampledDate;
  const firstDate = new Date(Math.min(repoCreatedDate.getTime(), genesisDate.getTime()));
  const lastCommitDate =
    sortedCommits.length > 0 ? new Date(sortedCommits[sortedCommits.length - 1].date) : new Date(repo.pushed_at);

  const diffMs = Math.max(0, lastCommitDate.getTime() - firstDate.getTime());
  const lifespanDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const lifespanFormatted = formatLifespan(lifespanDays);

  // Commits per month velocity using estimated total commits when sampled
  const lifespanMonths = Math.max(0.5, lifespanDays / 30.4);
  const effectiveCommitTotal = Math.max(commits.length, totalCommitCountEstimate || commits.length);
  const commitVelocityPerMonth = Number((effectiveCommitTotal / lifespanMonths).toFixed(1));

  // Night owl (22:00 - 05:00 UTC) vs weekend hacker (Saturday/Sunday)
  let nightCommits = 0;
  let weekendCommits = 0;
  const activeDaysSet = new Set<string>();

  for (const c of commits) {
    const d = new Date(c.date);
    if (isNaN(d.getTime())) continue;
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
    totalCommitCountEstimate: effectiveCommitTotal,
    commitVelocityPerMonth,
    nightOwlPercentage,
    weekendHackerPercentage,
    averageCommitsPerActiveDay,
    releasesCount: releases.length,
  };

  const detectedMilestones = detectMilestones(commits, releases, {
    isSampled,
    genesisCommit,
    totalCommitCountEstimate: effectiveCommitTotal,
  });
  const computedHeatmap = computeHeatmap(commits);
  const computedContributors = computeContributorTimeline(commits, contributors, { isSampled });
  const computedLanguages = computeLanguages(languages, commits);

  return {
    repo,
    metrics,
    milestones: detectedMilestones,
    heatmap: computedHeatmap,
    contributors: computedContributors,
    languages: computedLanguages,
    isSampled,
  };
}

export function generateRepoStory(bundle: RawRepoBundle, tone: NarrativeTone = "storyteller"): RepoStoryPayload {
  const base = buildStoryBase(bundle);
  const templateEngine = new TemplateNarrativeEngine();
  const narrative = templateEngine.generate(base, tone);

  return {
    ...base,
    narrative,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateRepoStoryWithNarrative(
  bundle: RawRepoBundle,
  tone: NarrativeTone = "storyteller"
): Promise<RepoStoryPayload> {
  const base = buildStoryBase(bundle);
  const generator = new PluggableNarrativeGenerator();
  const narrative = await generator.generate(base, tone);

  return {
    ...base,
    narrative,
    generatedAt: new Date().toISOString(),
  };
}
