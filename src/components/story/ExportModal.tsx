"use client";

import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  X,
  Download,
  Share2,
  Check,
  Star,
  GitFork,
  Calendar,
  Layers,
  Sparkles,
  GitBranch,
} from "lucide-react";
import { RepoStoryPayload } from "@/lib/analytics/types";
import { Button } from "@/components/ui/button";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: RepoStoryPayload;
}

export function ExportModal({ isOpen, onClose, story }: ExportModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { repo, metrics, heatmap, languages, milestones } = story;
  const primaryLang = languages.primaryLanguage || repo.language || "Open Source";

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `gitstory-${repo.owner.login}-${repo.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export PNG card:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(story, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `gitstory-${repo.owner.login}-${repo.name}.json`;
    link.click();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h3 className="text-lg font-bold text-white">Share & Export GitStory</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Preview */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Social Card Preview (1200 × 630 ratio)</span>
            <span className="font-mono text-brand-400">High-Resolution Retina Ready</span>
          </div>

          {/* Social Card to Rasterize */}
          <div
            ref={cardRef}
            className="w-full aspect-[1200/630] rounded-xl bg-gradient-to-br from-slate-950 via-[#0a0f1d] to-[#111827] border-2 border-slate-700/80 p-6 sm:p-8 flex flex-col justify-between text-white relative overflow-hidden shadow-2xl"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top row */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-md">
                  <GitBranch className="w-4 h-4" />
                </div>
                <span className="font-bold tracking-tight text-base font-mono">
                  GitStory.dev
                </span>
              </div>
              <span className="text-xs font-mono bg-brand-500/20 text-brand-300 px-2.5 py-1 rounded-full border border-brand-500/30">
                {primaryLang}
              </span>
            </div>

            {/* Center Info */}
            <div className="relative z-10 flex items-center gap-5 my-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={repo.owner.avatar_url}
                alt={repo.owner.login}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-slate-600 bg-slate-800 object-cover shadow-xl"
              />
              <div className="flex flex-col space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {repo.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-md">
                  {repo.description || "Interactive Git repository history and milestone chronicle."}
                </p>
              </div>
            </div>

            {/* Bottom Stats Grid */}
            <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-3 bg-slate-900/80 p-3 sm:p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Stars</span>
                <span className="font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 inline" />
                  {repo.stargazers_count.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Forks</span>
                <span className="font-mono font-bold text-blue-400 flex items-center gap-1">
                  <GitFork className="w-3 h-3 inline" />
                  {repo.forks_count.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Lifespan</span>
                <span className="font-mono font-bold text-emerald-400">
                  {metrics.lifespanFormatted}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Milestones</span>
                <span className="font-mono font-bold text-purple-400">
                  {milestones.length} logged
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? <Check className="w-4 h-4 text-emerald-400 mr-1" /> : <Share2 className="w-4 h-4 mr-1" />}
            <span>{copied ? "Link Copied!" : "Copy Share Link"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownloadJson}>
              <Download className="w-4 h-4 mr-1" />
              <span>Download JSON</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              isLoading={isExporting}
              onClick={handleDownloadPng}
            >
              <Download className="w-4 h-4 mr-1" />
              <span>Download PNG Card</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

