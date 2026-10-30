"use client";

import React, { useState } from "react";
import {
  Star,
  GitFork,
  AlertCircle,
  ExternalLink,
  Share2,
  Download,
  Image as ImageIcon,
  Check,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { RepoStoryPayload } from "@/lib/analytics/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StoryHeaderProps {
  story: RepoStoryPayload;
  onOpenExportModal: () => void;
  onDownloadJson: () => void;
  onOpenWrappedModal: () => void;
}

export function StoryHeader({ story, onOpenExportModal, onDownloadJson, onOpenWrappedModal }: StoryHeaderProps) {
  const { repo, metrics, isSampled } = story;
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4 sm:gap-5">
          {/* Owner avatar */}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={repo.owner.avatar_url}
              alt={repo.owner.login}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-slate-700 bg-slate-800 object-cover shadow-lg"
            />
            {repo.owner.type === "Organization" && (
              <span className="absolute -bottom-1 -right-1 bg-brand-600 text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold">
                ORG
              </span>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {repo.name}
              </h1>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-brand-300 transition-colors p-1"
                title="View on GitHub"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              {repo.license && (
                <Badge variant="outline" className="text-[11px] font-mono">
                  {repo.license.spdx_id || repo.license.name}
                </Badge>
              )}
              {isSampled && (
                <Badge variant="warning" className="text-[10px]">
                  Sampled (Large Repo)
                </Badge>
              )}
            </div>

            <p className="text-sm text-slate-400 max-w-2xl line-clamp-2">
              {repo.description || "No description provided for this repository."}
            </p>

            {/* Quick stats row */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <strong className="font-semibold">{repo.stargazers_count.toLocaleString()}</strong> stars
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
                <GitFork className="w-3.5 h-3.5 text-blue-400" />
                <strong className="font-semibold">{repo.forks_count.toLocaleString()}</strong> forks
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lifespan:</span>
                <strong className="font-semibold">{metrics.lifespanFormatted}</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Analyzed:</span>
                <strong className="font-semibold">{metrics.totalCommitsAnalyzed.toLocaleString()}</strong> commits
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenWrappedModal}
            className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 via-brand-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Launch Wrapped 🎉</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex-1 sm:flex-none"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? "Link Copied!" : "Share Link"}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenExportModal}
            className="flex-1 sm:flex-none"
          >
            <ImageIcon className="w-3.5 h-3.5 text-brand-400" />
            <span>Export Card</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onDownloadJson}
            className="flex-1 sm:flex-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON Data</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

