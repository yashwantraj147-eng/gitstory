"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, RefreshCw, ArrowLeft, Clock } from "lucide-react";
import { RepoStoryPayload } from "@/lib/analytics/types";
import { downloadStoryJson } from "@/lib/export/download";
import { StoryHeader } from "@/components/story/StoryHeader";
import { StoryNarrative } from "@/components/story/StoryNarrative";
import { TimelineView } from "@/components/story/TimelineView";
import { ContributorRace } from "@/components/story/ContributorRace";
import { ActivityHeatmap } from "@/components/story/ActivityHeatmap";
import { LanguageBreakdown } from "@/components/story/LanguageBreakdown";
import { MilestoneBadges } from "@/components/story/MilestoneBadges";
import { ExportModal } from "@/components/story/ExportModal";
import { StoryWrappedModal } from "@/components/story/StoryWrappedModal";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface StoryFetchResult {
  story: RepoStoryPayload | null;
  error: { message: string; type?: string; resetAt?: string } | null;
}

async function loadRepoStory(owner: string, repo: string, refresh: boolean): Promise<StoryFetchResult> {
  try {
    const url = `/api/story?repo=${encodeURIComponent(`${owner}/${repo}`)}${
      refresh ? "&refresh=true" : ""
    }`;
    const res = await fetch(url);
    const json = (await res.json()) as {
      error?: string;
      type?: string;
      resetAt?: string;
      data?: RepoStoryPayload;
    };

    if (!res.ok || !json.data) {
      return {
        story: null,
        error: {
          message: json.error || "Failed to load repository story.",
          type: json.type,
          resetAt: json.resetAt,
        },
      };
    }

    return { story: json.data, error: null };
  } catch (err) {
    return {
      story: null,
      error: {
        message: err instanceof Error ? err.message : "Network error occurred while fetching story.",
      },
    };
  }
}

function StoryView({ owner, repo }: { owner: string; repo: string }) {
  const router = useRouter();

  const [story, setStory] = useState<RepoStoryPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; type?: string; resetAt?: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isWrappedModalOpen, setIsWrappedModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadRepoStory(owner, repo, false).then((result) => {
      if (cancelled) return;
      setStory(result.story);
      setError(result.error);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [owner, repo]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    const result = await loadRepoStory(owner, repo, true);
    setStory(result.story);
    setError(result.error);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Loading repository story">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded-md" />
              <Skeleton className="h-4 w-96 rounded-md" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </div>

        <Skeleton className="h-72 w-full rounded-2xl" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {error.type === "RATE_LIMIT_EXCEEDED"
              ? "GitHub API Rate Limit Reached"
              : error.type === "NOT_FOUND"
              ? "Repository Not Found"
              : error.type === "EMPTY_REPO"
              ? "Repository is Empty"
              : "Unable to Analyze Repository"}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">{error.message}</p>
        </div>

        {error.type === "RATE_LIMIT_EXCEEDED" && error.resetAt && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs text-amber-400 font-mono">
            <Clock className="w-4 h-4" />
            <span>Resets at: {new Date(error.resetAt).toLocaleTimeString()}</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" size="md" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Search Another</span>
          </Button>

          <Button variant="primary" size="md" isLoading={isRefreshing} onClick={() => void handleRefresh()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="space-y-10 pb-16">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="text-slate-400 hover:text-white -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back to Search</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            isLoading={isRefreshing}
            onClick={() => void handleRefresh()}
            title="Bypass cache and pull latest data"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh Story</span>
          </Button>
        </div>
      </div>

      <StoryHeader
        story={story}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onDownloadJson={() => downloadStoryJson(story)}
        onOpenWrappedModal={() => setIsWrappedModalOpen(true)}
      />

      <ErrorBoundary fallbackTitle="Narrative view failed to render">
        <StoryNarrative initialNarrative={story.narrative} storyPayload={story} />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Badges view failed to render">
        <MilestoneBadges story={story} />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Milestone timeline failed to render">
        <TimelineView milestones={story.milestones} repoFullName={story.repo.full_name} />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Contributor chart failed to render">
        <ContributorRace timeline={story.contributors} />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Activity heatmap failed to render">
        <ActivityHeatmap heatmap={story.heatmap} />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Language breakdown failed to render">
        <LanguageBreakdown data={story.languages} />
      </ErrorBoundary>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        story={story}
      />

      <StoryWrappedModal
        isOpen={isWrappedModalOpen}
        onClose={() => setIsWrappedModalOpen(false)}
        story={story}
        onOpenExportCard={() => setIsExportModalOpen(true)}
      />
    </div>
  );
}

export default function StoryPage() {
  const params = useParams();
  const owner = typeof params?.owner === "string" ? params.owner : "";
  const repo = typeof params?.repo === "string" ? params.repo : "";

  if (!owner || !repo) {
    return null;
  }

  return <StoryView key={`${owner}/${repo}`} owner={owner} repo={repo} />;
}
