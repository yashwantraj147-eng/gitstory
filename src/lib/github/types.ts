export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  default_branch: string;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
    type: string;
  };
  topics?: string[];
}

export interface GitHubCommitSimple {
  sha: string;
  message: string;
  date: string;
  authorName: string;
  authorLogin: string | null;
  authorAvatar: string | null;
  additions?: number;
  deletions?: number;
  totalChurn?: number;
}

export interface GitHubCommitItem {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer?: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
  html_url: string;
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  published_at: string | null;
  created_at: string;
  html_url: string;
  body: string | null;
  prerelease: boolean;
}

export interface GitHubTag {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

export interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface GitHubLanguages {
  [language: string]: number;
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  resetTimeFormatted: string;
}

export interface RawRepoBundle {
  repo: GitHubRepo;
  commits: GitHubCommitSimple[];
  releases: GitHubRelease[];
  contributors: GitHubContributor[];
  languages: GitHubLanguages;
  isSampled: boolean;
  totalCommitCountEstimate: number;
  fetchedAt: string;
}

