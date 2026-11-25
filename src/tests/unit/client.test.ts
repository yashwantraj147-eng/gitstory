import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fetchRawRepoData,
  getRateLimitStatus,
  RateLimitError,
  RepoNotFoundError,
  EmptyRepoError,
  GitHubApiError,
} from "@/lib/github/client";

function jsonResponse(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

describe("GitHub API Client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns real-time rate limit status and sets unavailable flag on network failure", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({
        resources: {
          core: { limit: 5000, remaining: 4990, reset: 1800000000, used: 10 },
        },
      })
    );

    const status = await getRateLimitStatus("test-token");
    expect(status.limit).toBe(5000);
    expect(status.remaining).toBe(4990);
    expect(status.unavailable).toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.github.com/rate_limit",
      expect.objectContaining({ cache: "no-store" })
    );

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Offline"));
    const fallback = await getRateLimitStatus();
    expect(fallback.unavailable).toBe(true);
    expect(fallback.remaining).toBe(0);
  });

  it("throws RepoNotFoundError on 404 and EmptyRepoError on 409", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({ message: "Not Found" }, { status: 404 }));
    await expect(fetchRawRepoData("acme", "missing")).rejects.toBeInstanceOf(RepoNotFoundError);

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          id: 1,
          name: "empty",
          full_name: "acme/empty",
          description: null,
          private: false,
          html_url: "https://github.com/acme/empty",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          pushed_at: "2024-01-01T00:00:00Z",
          stargazers_count: 0,
          watchers_count: 0,
          forks_count: 0,
          open_issues_count: 0,
          language: null,
          default_branch: "main",
          license: null,
          owner: { login: "acme", avatar_url: "", html_url: "", type: "User" },
        })
      )
      .mockResolvedValueOnce(jsonResponse({ message: "Git Repository is empty." }, { status: 409 }));

    await expect(fetchRawRepoData("acme", "empty")).rejects.toBeInstanceOf(EmptyRepoError);
  });

  it("throws RateLimitError on primary 403/429 and secondary retry-after, and GitHubApiError on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse(
        { message: "API rate limit exceeded" },
        {
          status: 403,
          headers: {
            "x-ratelimit-remaining": "0",
            "x-ratelimit-limit": "60",
            "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 600),
          },
        }
      )
    );
    await expect(fetchRawRepoData("acme", "limited")).rejects.toBeInstanceOf(RateLimitError);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse(
        { message: "You have exceeded a secondary rate limit" },
        { status: 403, headers: { "retry-after": "30" } }
      )
    );
    await expect(fetchRawRepoData("acme", "secondary")).rejects.toBeInstanceOf(RateLimitError);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({ message: "Bad credentials" }, { status: 401 })
    );
    await expect(fetchRawRepoData("acme", "bad-token")).rejects.toBeInstanceOf(GitHubApiError);
  });

  it("samples large repos via Link header, fetches true genesis commit, enriches stats/files, and resolves tag dates", async () => {
    const repoMock = {
      id: 99,
      name: "mega-repo",
      full_name: "acme/mega-repo",
      description: "Large repo",
      private: false,
      html_url: "https://github.com/acme/mega-repo",
      created_at: "2019-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      pushed_at: "2026-01-01T00:00:00Z",
      stargazers_count: 1000,
      watchers_count: 1000,
      forks_count: 100,
      open_issues_count: 5,
      language: "TypeScript",
      default_branch: "main",
      license: null,
      owner: { login: "acme", avatar_url: "https://example.com/a.png", html_url: "", type: "Organization" },
    };

    const makeCommit = (sha: string, date: string, message = "feat: update") => ({
      sha,
      commit: { author: { name: "Dev", email: "dev@acme.dev", date }, message },
      author: { login: "dev", id: 1, avatar_url: "https://example.com/d.png", html_url: "" },
      html_url: `https://github.com/acme/mega-repo/commit/${sha}`,
    });

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);

      if (url === "https://api.github.com/repos/acme/mega-repo") {
        return jsonResponse(repoMock, { headers: { "x-ratelimit-remaining": "50" } });
      }
      if (url.includes("/commits?per_page=100&page=1")) {
        return jsonResponse([makeCommit("latest1", "2026-01-01T12:00:00Z")], {
          headers: {
            link: '<https://api.github.com/repos/acme/mega-repo/commits?per_page=100&page=5>; rel="last"',
            "x-ratelimit-remaining": "49",
          },
        });
      }
      if (url.includes("/commits?per_page=100&page=5")) {
        return jsonResponse(
          [
            makeCommit("mid-old", "2019-02-01T00:00:00Z"),
            makeCommit("genesis-sha", "2019-01-01T09:00:00Z", "Initial commit"),
          ],
          { headers: { "x-ratelimit-remaining": "48" } }
        );
      }
      if (url.includes("/commits?per_page=100&page=")) {
        const pageMatch = url.match(/page=(\d+)/);
        const p = pageMatch ? pageMatch[1] : "2";
        return jsonResponse([makeCommit(`page-${p}-sha`, `202${p}-01-01T00:00:00Z`, "refactor core")], {
          headers: { "x-ratelimit-remaining": "47" },
        });
      }
      if (url.includes("/commits/genesis-sha")) {
        return jsonResponse({
          ...makeCommit("genesis-sha", "2019-01-01T09:00:00Z", "Initial commit"),
          stats: { total: 500, additions: 480, deletions: 20 },
          files: [{ filename: "src/main.ts", additions: 480, deletions: 20, changes: 500 }],
        });
      }
      if (url.includes("/commits/")) {
        const sha = url.split("/commits/")[1];
        return jsonResponse({
          ...makeCommit(sha, "2025-01-01T00:00:00Z"),
          stats: { total: 120, additions: 100, deletions: 20 },
          files: [{ filename: "README.md", additions: 100, deletions: 20, changes: 120 }],
        });
      }
      if (url.endsWith("/releases?per_page=100")) {
        return jsonResponse([]);
      }
      if (url.endsWith("/tags?per_page=100")) {
        return jsonResponse([{ name: "v1.0.0", commit: { sha: "latest1", url: "" } }]);
      }
      if (url.endsWith("/contributors?per_page=100")) {
        return jsonResponse([{ login: "dev", id: 1, avatar_url: "", html_url: "", contributions: 400 }]);
      }
      if (url.endsWith("/languages")) {
        return jsonResponse({ TypeScript: 9000 });
      }
      return jsonResponse({}, { status: 404 });
    });

    const bundle = await fetchRawRepoData("acme", "mega-repo", { maxCommits: 200, bypassCache: true });

    expect(bundle.isSampled).toBe(true);
    expect(bundle.genesisCommit?.sha).toBe("genesis-sha");
    expect(bundle.genesisCommit?.totalChurn).toBe(500);
    expect(bundle.totalCommitCountEstimate).toBe(402);
    expect(bundle.releases.length).toBe(1);
    expect(bundle.releases[0].tag_name).toBe("v1.0.0");
    expect(bundle.releases[0].published_at).toBe("2026-01-01T12:00:00Z");
  });
});
