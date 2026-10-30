import { NextRequest, NextResponse } from "next/server";
import { parseRepoInput } from "@/lib/github/parsers";
import { fetchRawRepoData, GitHubApiError, RateLimitError, RepoNotFoundError, EmptyRepoError } from "@/lib/github/client";
import { repoCache } from "@/lib/github/cache";
import { generateRepoStory } from "@/lib/analytics/engine";
import { RepoStoryPayload } from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoInput = searchParams.get("repo");
    const refresh = searchParams.get("refresh") === "true";
    const maxCommitsParam = searchParams.get("maxCommits");
    const maxCommits = maxCommitsParam ? Math.min(2000, Math.max(100, parseInt(maxCommitsParam, 10))) : 1000;

    if (!repoInput) {
      return NextResponse.json(
        { error: "Repository query parameter 'repo' is required." },
        { status: 400 }
      );
    }

    const parsed = parseRepoInput(repoInput);
    if (!parsed) {
      return NextResponse.json(
        {
          error: "Invalid repository format. Please provide a GitHub URL (e.g. https://github.com/facebook/react) or 'owner/repo' format.",
        },
        { status: 400 }
      );
    }

    const cacheKey = `story:${parsed.owner.toLowerCase()}/${parsed.repo.toLowerCase()}`;

    if (!refresh) {
      const cachedStory = repoCache.get<RepoStoryPayload>(cacheKey);
      if (cachedStory) {
        return NextResponse.json(
          { success: true, data: cachedStory, cached: true },
          {
            status: 200,
            headers: {
              "x-gitstory-cache": "HIT",
            },
          }
        );
      }
    }

    // Fetch and analyze
    const rawBundle = await fetchRawRepoData(parsed.owner, parsed.repo, { maxCommits });
    const story = generateRepoStory(rawBundle);

    // Cache story for 30 minutes
    repoCache.set(cacheKey, story, 30 * 60 * 1000);

    return NextResponse.json(
      { success: true, data: story, cached: false },
      {
        status: 200,
        headers: {
          "x-gitstory-cache": "MISS",
        },
      }
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: error.message,
          type: "RATE_LIMIT_EXCEEDED",
          resetAt: error.resetAt.toISOString(),
          limit: error.limit,
          remaining: error.remaining,
        },
        { status: 429 }
      );
    }

    if (error instanceof RepoNotFoundError) {
      return NextResponse.json(
        { error: error.message, type: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (error instanceof EmptyRepoError) {
      return NextResponse.json(
        { error: error.message, type: "EMPTY_REPO" },
        { status: 400 }
      );
    }

    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        { error: error.message, type: "GITHUB_API_ERROR" },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: `Failed to process repository: ${message}`, type: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

