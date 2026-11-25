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
      `GitHub API rate limit exceeded. Resets in ~${minutesLeft} minute(s) at ${resetAt.toLocaleTimeString()}. You can provide a GITHUB_TOKEN in .env.local to increase your limit to 5,000 requests/hour.`,
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

interface RequestOptions {
  token?: string;
  bypassCache?: boolean;
}

async function requestGitHub<T>(
  url: string,
  options?: RequestOptions
): Promise<{ data: T; headers: Headers; status: number; remaining: number | null }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitStory-Visualizer",
    ...getAuthHeader(options?.token),
  };

  const fetchInit: RequestInit & { next?: { revalidate: number } } = options?.bypassCache
    ? { headers, cache: "no-store" }
    : { headers, next: { revalidate: 3600 } };

  const response = await fetch(url, fetchInit);

  const remainingHeader = response.headers.get("x-ratelimit-remaining");
  const resetHeader = response.headers.get("x-ratelimit-reset");
  const limitHeader = response.headers.get("x-ratelimit-limit");
  const retryAfterHeader = response.headers.get("retry-after");
  const remaining = remainingHeader !== null ? parseInt(remainingHeader, 10) : null;

  if (response.status === 401) {
    throw new GitHubApiError(
      "GitHub API authentication failed (401). Please check or remove your GITHUB_TOKEN.",
      401
    );
  }

  if (response.status === 403 || response.status === 429) {
    if (remaining === 0 && resetHeader) {
      const resetTime = new Date(parseInt(resetHeader, 10) * 1000);
      throw new RateLimitError(
        resetTime,
        limitHeader ? parseInt(limitHeader, 10) : 60,
        0
      );
    }

    const bodyText = await response.text();
    if (retryAfterHeader || /rate limit/i.test(bodyText)) {
      const retrySeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
      const resetTime = new Date(Date.now() + (Number.isFinite(retrySeconds) ? retrySeconds : 60) * 1000);
      throw new RateLimitError(
        resetTime,
        limitHeader ? parseInt(limitHeader, 10) : 60,
        remaining ?? 0
      );
    }

    throw new GitHubApiError(`GitHub API forbidden (${response.status}): ${bodyText}`, response.status);
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
  return { data, headers: response.headers, status: response.status, remaining };
}

function parseLastPageFromLink(linkHeader: string | null): number | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function mapCommitItem(c: GitHubCommitItem): GitHubCommitSimple {
  const commitDate = c.commit?.author?.date || c.commit?.committer?.date || new Date().toISOString();
  const authorName = c.commit?.author?.name || c.author?.login || "Unknown";
  const authorLogin = c.author?.login || null;
  const authorAvatar = c.author?.avatar_url || null;

  return {
    sha: c.sha,
    message: c.commit?.message || "",
    date: commitDate,
    authorName,
    authorLogin,
    authorAvatar,
    additions: c.stats?.additions,
    deletions: c.stats?.deletions,
    totalChurn: c.stats?.total,
    files: c.files?.map((f) => ({
      filename: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
    })),
  };
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
    }>("https://api.github.com/rate_limit", { token, bypassCache: true });

    const core = data.resources.core;
    const resetDate = new Date(core.reset * 1000);

    return {
      limit: core.limit,
      remaining: core.remaining,
      reset: core.reset,
      used: core.used,
      resetTimeFormatted: resetDate.toLocaleTimeString(),
    };
  } catch {
    return {
      limit: 60,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 3600,
      used: 0,
      resetTimeFormatted: "Unavailable",
      unavailable: true,
    };
  }
}

export async function fetchRawRepoData(
  owner: string,
  repo: string,
  options?: { token?: string; maxCommits?: number; bypassCache?: boolean }
): Promise<RawRepoBundle> {
  const rawMax = options?.maxCommits ?? 1000;
  const maxCommits = Number.isFinite(rawMax) ? Math.min(2000, Math.max(100, rawMax)) : 1000;
  const maxPages = Math.max(1, Math.floor(maxCommits / 100));
  const reqOpts: RequestOptions = {
    token: options?.token,
    bypassCache: options?.bypassCache,
  };

  // 1. Fetch Repository Metadata
  let repoData: GitHubRepo;
  try {
    const repoRes = await requestGitHub<GitHubRepo>(
      `https://api.github.com/repos/${owner}/${repo}`,
      reqOpts
    );
    repoData = repoRes.data;
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      throw new RepoNotFoundError(owner, repo);
    }
    throw error;
  }

  // 2. Fetch Page 1 of Commits and inspect Link header for true repo depth
  const perPage = 100;
  let firstPageCommits: GitHubCommitItem[];
  let lastPage: number | null = null;
  let remainingQuota: number | null = null;

  try {
    const page1Res = await requestGitHub<GitHubCommitItem[]>(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}&page=1`,
      reqOpts
    );
    firstPageCommits = page1Res.data;
    lastPage = parseLastPageFromLink(page1Res.headers.get("link"));
    remainingQuota = page1Res.remaining;
  } catch (err) {
    if (err instanceof GitHubApiError && (err.status === 409 || err.status === 404)) {
      throw new EmptyRepoError(owner, repo);
    }
    throw err;
  }

  if (!firstPageCommits || firstPageCommits.length === 0) {
    throw new EmptyRepoError(owner, repo);
  }

  const commitMap = new Map<string, GitHubCommitSimple>();
  for (const item of firstPageCommits) {
    const mapped = mapCommitItem(item);
    commitMap.set(mapped.sha, mapped);
  }

  let isSampled = false;
  let totalCommitCountEstimate = commitMap.size;
  let genesisCommit: GitHubCommitSimple | undefined;

  if (lastPage && lastPage > 1) {
    if (lastPage <= maxPages) {
      // Full history fits within budget
      const pageNumbers = Array.from({ length: lastPage - 1 }, (_, idx) => idx + 2);
      const responses = await Promise.all(
        pageNumbers.map((pageNum) =>
          requestGitHub<GitHubCommitItem[]>(
            `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${pageNum}`,
            reqOpts
          ).catch(() => null)
        )
      );

      for (const res of responses) {
        if (!res) continue;
        if (res.remaining !== null) remainingQuota = res.remaining;
        for (const item of res.data) {
          const mapped = mapCommitItem(item);
          commitMap.set(mapped.sha, mapped);
        }
      }

      totalCommitCountEstimate = commitMap.size;
    } else {
      // Large repo: sample recent pages + evenly distributed historical pages + final page (genesis)
      isSampled = true;
      const pagesToFetch = new Set<number>();

      // Always grab pages 2..min(4, maxPages-1) for dense recent heatmap/velocity
      const recentPages = Math.min(4, Math.max(2, maxPages - 2));
      for (let p = 2; p <= recentPages; p++) {
        pagesToFetch.add(p);
      }

      // Always fetch lastPage so we get the true Genesis Commit
      pagesToFetch.add(lastPage);

      // Fill remaining page budget with evenly spaced historical pages
      const remainingSlots = Math.max(0, maxPages - 1 - pagesToFetch.size);
      if (remainingSlots > 0) {
        const spanStart = recentPages + 1;
        const spanEnd = lastPage - 1;
        for (let i = 1; i <= remainingSlots; i++) {
          const sampledPage = Math.round(
            spanStart + ((spanEnd - spanStart) * i) / (remainingSlots + 1)
          );
          if (sampledPage > recentPages && sampledPage < lastPage) {
            pagesToFetch.add(sampledPage);
          }
        }
      }

      const sortedPages = Array.from(pagesToFetch).sort((a, b) => a - b);
      const responses = await Promise.all(
        sortedPages.map(async (pageNum) => {
          const res = await requestGitHub<GitHubCommitItem[]>(
            `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${pageNum}`,
            reqOpts
          ).catch(() => null);
          return { pageNum, res };
        })
      );

      let lastPageCount = 100;
      for (const { pageNum, res } of responses) {
        if (!res) continue;
        if (res.remaining !== null) remainingQuota = res.remaining;
        if (pageNum === lastPage && res.data.length > 0) {
          lastPageCount = res.data.length;
          const oldestOnLastPage = res.data[res.data.length - 1];
          genesisCommit = mapCommitItem(oldestOnLastPage);
        }
        for (const item of res.data) {
          const mapped = mapCommitItem(item);
          commitMap.set(mapped.sha, mapped);
        }
      }

      totalCommitCountEstimate = (lastPage - 1) * perPage + lastPageCount;
    }
  }

  const commitList = Array.from(commitMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (!genesisCommit && commitList.length > 0) {
    genesisCommit = commitList[0];
  }

  // 3. Enrich a small sample of commits with stats + file extensions (for Megacommit & Language Evolution)
  // Guarded on rate limit remaining so we never exhaust unauthenticated quotas
  const canEnrichDetails = remainingQuota === null || remainingQuota > 20;
  if (canEnrichDetails && commitList.length > 0) {
    const sampleIndices = new Set<number>([0, commitList.length - 1]);
    const targetDetailCount = Math.min(6, commitList.length);
    for (let i = 1; i < targetDetailCount - 1; i++) {
      sampleIndices.add(Math.floor((i * (commitList.length - 1)) / (targetDetailCount - 1)));
    }
    // Also prioritize one commit with refactor/overhaul/init keywords if present
    const keywordCommitIdx = commitList.findIndex((c) =>
      /\b(refactor|overhaul|rewrite|migrate|v1|initial)\b/i.test(c.message)
    );
    if (keywordCommitIdx >= 0 && sampleIndices.size < 7) {
      sampleIndices.add(keywordCommitIdx);
    }

    const shasToEnrich = Array.from(sampleIndices).map((idx) => commitList[idx].sha);
    const detailResults = await Promise.allSettled(
      shasToEnrich.map((sha) =>
        requestGitHub<GitHubCommitItem>(
          `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
          reqOpts
        )
      )
    );

    const detailBySha = new Map<string, GitHubCommitItem>();
    for (const res of detailResults) {
      if (res.status === "fulfilled") {
        detailBySha.set(res.value.data.sha, res.value.data);
      }
    }

    for (const commit of commitList) {
      const detail = detailBySha.get(commit.sha);
      if (detail) {
        commit.additions = detail.stats?.additions;
        commit.deletions = detail.stats?.deletions;
        commit.totalChurn = detail.stats?.total;
        commit.files = detail.files?.map((f) => ({
          filename: f.filename,
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes,
        }));
      }
    }

    if (genesisCommit && detailBySha.has(genesisCommit.sha)) {
      const gDetail = detailBySha.get(genesisCommit.sha)!;
      genesisCommit.additions = gDetail.stats?.additions;
      genesisCommit.deletions = gDetail.stats?.deletions;
      genesisCommit.totalChurn = gDetail.stats?.total;
    }
  }

  // 4. Fetch Releases, Contributors & Languages in parallel
  const [relOutcome, contribOutcome, langOutcome] = await Promise.allSettled([
    requestGitHub<GitHubRelease[]>(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`,
      reqOpts
    ),
    requestGitHub<GitHubContributor[]>(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`,
      reqOpts
    ),
    requestGitHub<GitHubLanguages>(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
      reqOpts
    ),
  ]);

  let releases: GitHubRelease[] =
    relOutcome.status === "fulfilled" ? relOutcome.value.data : [];

  // If no GitHub Releases exist, fall back to Git Tags and resolve real commit dates for key tags
  if (releases.length === 0) {
    try {
      const tagsRes = await requestGitHub<GitHubTag[]>(
        `https://api.github.com/repos/${owner}/${repo}/tags?per_page=100`,
        reqOpts
      );
      const tags = tagsRes.data;
      if (tags.length > 0) {
        const keyTagIndices = new Set<number>([0, tags.length - 1]);
        const v1Idx = tags.findIndex((t) => /^v?1\.0(\.0)?$/i.test(t.name));
        if (v1Idx >= 0) keyTagIndices.add(v1Idx);
        if (tags.length > 4) {
          keyTagIndices.add(Math.floor(tags.length / 2));
        }

        const tagDateMap = new Map<string, string>();
        // Resolve commit dates for key tags if quota permits
        if (remainingQuota === null || remainingQuota > 15) {
          const lookups = await Promise.allSettled(
            Array.from(keyTagIndices).map(async (idx) => {
              const tag = tags[idx];
              const existing = commitMap.get(tag.commit.sha);
              if (existing) return { sha: tag.commit.sha, date: existing.date };
              const cRes = await requestGitHub<GitHubCommitItem>(
                `https://api.github.com/repos/${owner}/${repo}/commits/${tag.commit.sha}`,
                reqOpts
              );
              return {
                sha: tag.commit.sha,
                date:
                  cRes.data.commit?.author?.date ||
                  cRes.data.commit?.committer?.date ||
                  "",
              };
            })
          );

          for (const item of lookups) {
            if (item.status === "fulfilled" && item.value.date) {
              tagDateMap.set(item.value.sha, item.value.date);
            }
          }
        }

        // Only include tags whose real commit date could be resolved
        releases = tags
          .filter((t) => tagDateMap.has(t.commit.sha) || commitMap.has(t.commit.sha))
          .map((t, idx) => {
            const realDate = tagDateMap.get(t.commit.sha) || commitMap.get(t.commit.sha)!.date;
            return {
              id: idx + 1,
              tag_name: t.name,
              name: t.name,
              published_at: realDate,
              created_at: realDate,
              html_url: `https://github.com/${owner}/${repo}/releases/tag/${t.name}`,
              body: null,
              prerelease: false,
            };
          });
      }
    } catch {
      // Ignore tags error
    }
  }

  const contributors: GitHubContributor[] =
    contribOutcome.status === "fulfilled"
      ? contribOutcome.value.data.filter((c) => c && c.login)
      : [];

  const languages: GitHubLanguages =
    langOutcome.status === "fulfilled" ? langOutcome.value.data : {};

  return {
    repo: repoData,
    commits: commitList,
    genesisCommit,
    releases,
    contributors,
    languages,
    isSampled,
    totalCommitCountEstimate,
    fetchedAt: new Date().toISOString(),
  };
}
