import { GitHubRepo, GitHubCommitSimple, GitHubRelease, GitHubContributor } from "../github/types";

export type MilestoneType =
  | "genesis"
  | "century"
  | "monster_commit"
  | "slumber"
  | "golden_era"
  | "release"
  | "contributor_boom";

export interface Milestone {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  date: string;
  iconName: "Sparkles" | "Trophy" | "Zap" | "Moon" | "Flame" | "Tag" | "Users";
  badgeColor: string;
  metadata?: Record<string, string | number>;
}

export interface PunchcardCell {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  hour: number;      // 0 - 23
  count: number;
  intensity: number; // 0.0 - 1.0 normalized
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapData {
  punchcard: PunchcardCell[];
  peakDay: number;
  peakDayName: string;
  peakHour: number;
  peakHourLabel: string;
  calendarDays: CalendarDay[];
  maxDailyCommits: number;
  totalActiveDays: number;
  longestStreakDays: number;
  currentStreakDays: number;
}

export interface ContributorTimeBucket {
  period: string; // YYYY-MM
  ranks: {
    login: string;
    avatarUrl: string | null;
    commits: number;
  }[];
}

export interface ContributorTimeline {
  periods: string[];
  buckets: ContributorTimeBucket[];
  topContributors: {
    login: string;
    avatarUrl: string | null;
    totalCommits: number;
    firstCommitDate: string;
    lastCommitDate: string;
    percentage: number;
  }[];
  totalUniqueAuthors: number;
}

export interface LanguageItem {
  name: string;
  bytes: number;
  percentage: number;
  color: string;
}

export interface LanguageBreakdownData {
  languages: LanguageItem[];
  primaryLanguage: string | null;
  totalBytes: number;
}

export interface RepoStoryMetrics {
  lifespanDays: number;
  lifespanFormatted: string;
  totalCommitsAnalyzed: number;
  commitVelocityPerMonth: number;
  nightOwlPercentage: number;
  weekendHackerPercentage: number;
  averageCommitsPerActiveDay: number;
  releasesCount: number;
}

export interface StoryNarrative {
  title: string;
  subtitle: string;
  chapters: {
    id: string;
    title: string;
    timeframe: string;
    summary: string;
    content: string;
    highlightMetric?: string;
  }[];
  tone: "storyteller" | "chronicle" | "humorous";
  generatedBy: "template" | "ai";
}

export interface RepoStoryPayload {
  repo: GitHubRepo;
  metrics: RepoStoryMetrics;
  milestones: Milestone[];
  heatmap: HeatmapData;
  contributors: ContributorTimeline;
  languages: LanguageBreakdownData;
  narrative: StoryNarrative;
  isSampled: boolean;
  generatedAt: string;
}
