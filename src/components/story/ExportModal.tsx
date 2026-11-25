"use client";

import React, { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  X,
  Download,
  Share2,
  Check,
  Star,
  GitFork,
  Sparkles,
  GitBranch,
  AlertCircle,
} from "lucide-react";
import { RepoStoryPayload } from "@/lib/analytics/types";
import { copyCurrentUrl, downloadStoryJson } from "@/lib/export/download";
import { Button } from "@/components/ui/button";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: RepoStoryPayload;
}

export function ExportModal({ isOpen, onClose, story }: ExportModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { repo, metrics, languages, milestones } = story;
  const primaryLang = languages.primaryLanguage || repo.language || "Open Source";

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      setExportError(null);
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `gitstory-${repo.owner.login}-${repo.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to rasterize card image";
      setExportError(`PNG export failed (${msg}). Try downloading the JSON dataset instead.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyCurrentUrl();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h3 id="export-modal-title" className="text-lg font-bold text-white">
              Share & Export GitStory
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Social Card Preview (1200 × 630 ratio)</span>
            <span className="font-mono text-brand-400">High-Resolution Retina Ready</span>
          </div>

          <div
            ref={cardRef}
            className="w-full aspect-[1200/630] rounded-xl bg-gradient-to-br from-slate-950 via-[#0a0f1d] to-[#111827] border-2 border-slate-700/80 p-6 sm:p-8 flex flex-col justify-between text-white relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-md">
                  <GitBranch className="w-4 h-4" />
                </div>
                <span className="font-bold tracking-tight text-base font-mono">GitStory.dev</span>
              </div>
              <span className="text-xs font-mono bg-brand-500/20 text-brand-300 px-2.5 py-1 rounded-full border border-brand-500/30">
                {primaryLang}
              </span>
            </div>

            <div className="relative z-10 flex items-center gap-5 my-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={repo.owner.avatar_url}
                alt={`${repo.owner.login} avatar`}
                crossOrigin="anonymous"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-slate-600 bg-slate-800 object-cover shadow-xl"
              />
              <div className="flex flex-col space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {repo.full_name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-md">
                  {repo.description || "Interactive Git repository history and milestone chronicle."}
                </p>
              </div>
            </div>

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

          {exportError && (
            <div role="alert" className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{exportError}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <Button variant="outline" size="sm" onClick={() => void handleCopyLink()}>
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400 mr-1" />
            ) : (
              <Share2 className="w-4 h-4 mr-1" />
            )}
            <span>{copied ? "Link Copied!" : "Copy Share Link"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => downloadStoryJson(story)}>
              <Download className="w-4 h-4 mr-1" />
              <span>Download JSON</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              isLoading={isExporting}
              onClick={() => void handleDownloadPng()}
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
