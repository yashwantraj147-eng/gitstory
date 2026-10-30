import { RepoStoryMetrics, Milestone, HeatmapData, ContributorTimeline, LanguageBreakdownData, StoryNarrative } from "../analytics/types";
import { GitHubRepo } from "../github/types";

export interface NarrativeContext {
  repo: GitHubRepo;
  metrics: RepoStoryMetrics;
  milestones: Milestone[];
  heatmap: HeatmapData;
  contributors: ContributorTimeline;
  languages: LanguageBreakdownData;
}

export type NarrativeTone = "storyteller" | "chronicle" | "humorous";

export interface NarrativeProvider {
  name: string;
  generateNarrative(context: NarrativeContext, tone?: NarrativeTone): Promise<StoryNarrative>;
}
