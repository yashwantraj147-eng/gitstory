import {
  GitHubRepo,
  GitHubCommitSimple,
  GitHubCommitItem,
  GitHubRelease,
  GitHubTag,
  GitHubContributor,
  GitHubLanguages,
  RateLimitStatus,
  RawRepoBundle,
} from "./types";

export class GitHubApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export class RateLimitError extends GitHubApiError {
  constructor(public resetAt: Date, public limit: number, public remaining: number) {
    const minutesLeft = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / (1000 * 60)));
    super(
      `GitHub API rate limit exceeded. Resets in ~${minutesLeft} minute(s) at ${resetAt.toLocaleTimeString()}. You can provide a GITHUB_TOKEN in settings to increase your limit to 5,000 requests/hour.`,
      429,
      { resetAt, limit, remaining }
    );
    this.name = "RateLimitError";
  }
}

export class RepoNotFoundError extends GitHubApiError {
  constructor(owner: string, repo: string) {
    super(
      `Repository "${owner}/${repo}" was not found. Please verify the URL or ensure the repository is public.`,
      404
    );
    this.name = "RepoNotFoundError";
  }
}

export class EmptyRepoError extends GitHubApiError {
  constructor(owner: string, repo: string) {
    super(
      `Repository "${owner}/${repo}" is empty or has no commits yet.`,
      400
    );
    this.name = "EmptyRepoError";
  }
}

function getAuthHeader(token?: string): Record<string, string> {
  const activeToken = token || process.env.GITHUB_TOKEN;
  if (activeToken && activeToken.trim()) {
    return {
      Authorization: `Bearer ${activeToken.trim()}`,
    };
  }
  return {};
}

async function requestGitHub<T>(
  url: string,
  token?: string
): Promise<{ data: T; headers: Headers; status: number }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitStory-Visualizer",
    ...getAuthHeader(token),
  };

  const response = await fetch(url, {
    headers,
    next: { revalidate: 3600 },
  });

  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");
  const limit = response.headers.get("x-ratelimit-limit");

  if (response.status === 403 || response.status === 429) {
    if (remaining === "0" && reset) {
      const resetTime = new Date(parseInt(reset, 10) * 1000);
      throw new RateLimitError(
        resetTime,
        limit ? parseInt(limit, 10) : 60,
        0
      );
    }
  }

  if (response.status === 404) {
    throw new GitHubApiError("Resource not found", 404);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new GitHubApiError(
      `GitHub API error (${response.status}): ${errorBody}`,
      response.status
    );
  }

  const data = (await response.json()) as T;
  return { data, headers: response.headers, status: response.status };
}

export async function getRateLimitStatus(token?: string): Promise<RateLimitStatus> {
  try {
    const { data } = await requestGitHub<{
      resources: {
        core: {
          limit: number;
          remaining: number;
          reset: number;
          used: number;
        };
      };
    }>("https://api.github.com/rate_limit", token);

    const core = data.resources.core;
    const resetDate = new Date(core.reset * 1000);

    return {
      limit: core.limit,
      remaining: core.remaining,
      reset: core.reset,
      used: core.used,
      resetTimeFormatted: resetDate.toLocaleTimeString(),
    };
  } catch (error) {
    return {
      limit: 60,
      remaining: 60,
      reset: Math.floor(Date.now() / 1000) + 3600,
      used: 0,
      resetTimeFormatted: "Unknown",
    };
  }
}

export async function fetchRawRepoData(
  owner: string,
  repo: string,
  options?: { token?: string; maxCommits?: number }
): Promise<RawRepoBundle> {
  const maxCommits = options?.maxCommits ?? 1000;
  const token = options?.token;

  // 1. Fetch Repository Metadata
  let repoData: GitHubRepo;
  try {
    const repoRes = await requestGitHub<GitHubRepo>(
      `https://api.github.com/repos/${owner}/${repo}`,
      token
    );
    repoData = repoRes.data;
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      throw new RepoNotFoundError(owner, repo);
    }
    throw error;
  }

  // 2. Fetch Commits (Paginated up to maxCommits)
  const commitList: GitHubCommitSimple[] = [];
  let page = 1;
  const perPage = 100;
  let isSampled = false;

  while (commitList.length < maxCommits) {
    let rawCommits: GitHubCommitItem[];
    try {
      const commitsRes = await requestGitHub<GitHubCommitItem[]>(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`,
        token
      );
      rawCommits = commitsRes.data;
    } catch (err) {
      if (err instanceof GitHubApiError && (err.status === 409 || err.status === 404)) {
        if (page === 1) {
          throw new EmptyRepoError(owner, repo);
        }
        break;
      }
      throw err;
    }

    if (!rawCommits || rawCommits.length === 0) {
      break;
    }

    for (const c of rawCommits) {
      const commitDate = c.commit?.author?.date || c.commit?.committer?.date || new Date().toISOString();
      const authorName = c.commit?.author?.name || c.author?.login || "Unknown";
      const authorLogin = c.author?.login || null;
      const authorAvatar = c.author?.avatar_url || null;

      commitList.push({
        sha: c.sha,
        message: c.commit?.message || "",
        date: commitDate,
        authorName,
        authorLogin,
        authorAvatar,
        additions: c.stats?.additions,
        deletions: c.stats?.deletions,
        totalChurn: c.stats?.total,
      });
    }

    if (rawCommits.length < perPage) {
      // Reached the end of commits
      break;
    }

    page += 1;
  }

  if (commitList.length === 0) {
    throw new EmptyRepoError(owner, repo);
  }

  if (commitList.length >= maxCommits) {
    isSampled = true;
  }

  // Sort commits chronologically (oldest to newest)
  commitList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 3. Fetch Releases & Fallback Tags in parallel
  let releases: GitHubRelease[] = [];
  try {
    const relRes = await requestGitHub<GitHubRelease[]>(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`,
      token
    );
    releases = relRes.data;
  } catch (err) {
    // Releases may be empty or unavailable, proceed
    releases = [];
  }

  // If no releases found, try tags as release markers
  if (releases.length === 0) {
    try {
      const tagsRes = await requestGitHub<GitHubTag[]>(
        `https://api.github.com/repos/${owner}/${repo}/tags?per_page=100`,
        token
      );
      const tags = tagsRes.data;
      releases = tags.map((t, idx) => ({
        id: idx + 1,
        tag_name: t.name,
        name: t.name,
        published_at: null,
        created_at: new Date().toISOString(),
        html_url: `https://github.com/${owner}/${repo}/releases/tag/${t.name}`,
        body: null,
        prerelease: false,
      }));
    } catch {
      // Ignore tags error
    }
  }

  // 4. Fetch Contributors
  let contributors: GitHubContributor[] = [];
  try {
    const contribRes = await requestGitHub<GitHubContributor[]>(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`,
      token
    );
    contributors = contribRes.data.filter((c) => c && c.login);
  } catch {
    // Some repos have too many contributors to compute immediately, fallback
    contributors = [];
  }

  // 5. Fetch Languages
  let languages: GitHubLanguages = {};
  try {
    const langRes = await requestGitHub<GitHubLanguages>(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
      token
    );
    languages = langRes.data;
  } catch {
    languages = {};
  }

  return {
    repo: repoData,
    commits: commitList,
    releases,
    contributors,
    languages,
    isSampled,
    totalCommitCountEstimate: isSampled ? Math.max(commitList.length * 2, 1000) : commitList.length,
    fetchedAt: new Date().toISOString(),
  };
}

