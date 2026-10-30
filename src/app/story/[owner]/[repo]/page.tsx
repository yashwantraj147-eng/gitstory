"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { RepoStoryPayload } from "@/lib/analytics/types";
import { StoryHeader } from "@/components/story/StoryHeader";
import { StoryNarrative } from "@/components/story/StoryNarrative";
import { TimelineView } from "@/components/story/TimelineView";
import { ContributorRace } from "@/components/story/ContributorRace";
import { ActivityHeatmap } from "@/components/story/ActivityHeatmap";
import { LanguageBreakdown } from "@/components/story/LanguageBreakdown";
import { MilestoneBadges } from "@/components/story/MilestoneBadges";
import { ExportModal } from "@/components/story/ExportModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();

  const owner = params?.owner as string;
  const repo = params?.repo as string;

  const [story, setStory] = useState<RepoStoryPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; type?: string; resetAt?: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStory = async (refresh = false) => {
    if (!owner || !repo) return;

    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const url = `/api/story?repo=${encodeURIComponent(`${owner}/${repo}`)}${refresh ? "&refresh=true" : ""}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        setError({
          message: json.error || "Failed to load repository story.",
          type: json.type,
          resetAt: json.resetAt,
        });
        setStory(null);
        return;
      }

      setStory(json.data);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Network error occurred while fetching story.",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, repo]);

  const handleDownloadJson = () => {
    if (!story) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(story, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `gitstory-${owner}-${repo}.json`;
    link.click();
  };

  // Loading skeleton screen
  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in">
        {/* Back Link */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        {/* Header Skeleton */}
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

        {/* Narrative Skeleton */}
        <Skeleton className="h-72 w-full rounded-2xl" />

        {/* Charts Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {error.type === "RATE_LIMIT_EXCEEDED"
              ? "GitHub API Rate Limit Reached"
              : error.type === "NOT_FOUND"
              ? "Repository Not Found"
              : error.type === "EMPTY_REPO"
              ? "Repository is Empty"
              : "Unable to Analyze Repository"}
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {error.message}
          </p>
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

          <Button variant="primary" size="md" onClick={() => fetchStory(true)}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="space-y-10 animate-in fade-in pb-16">
      {/* Navigation and Refresh Bar */}
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
            onClick={() => fetchStory(true)}
            title="Bypass cache and pull latest data"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh Story</span>
          </Button>
        </div>
      </div>

      {/* 1. Header Overview Card */}
      <StoryHeader
        story={story}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onDownloadJson={handleDownloadJson}
      />

      {/* 2. AI / Template Narrative Reader */}
      <StoryNarrative
        initialNarrative={story.narrative}
        storyPayload={story}
      />

      {/* 3. Milestone Accolades Badges */}
      <MilestoneBadges story={story} />

      {/* 4. Animated Milestone Timeline */}
      <TimelineView
        milestones={story.milestones}
        repoFullName={story.repo.full_name}
      />

      {/* 5. Contributor Bar Race Chart */}
      <ContributorRace timeline={story.contributors} />

      {/* 6. Heatmaps: 52-Week Calendar & 24x7 Punchcard */}
      <ActivityHeatmap heatmap={story.heatmap} />

      {/* 7. Languages & Architecture Breakdown */}
      <LanguageBreakdown data={story.languages} />

      {/* Export / Social Card Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        story={story}
      />
    </div>
  );
}

