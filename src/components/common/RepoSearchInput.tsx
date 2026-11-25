"use client";

import React, { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, ArrowRight, AlertCircle, History } from "lucide-react";
import { parseRepoInput } from "@/lib/github/parsers";
import { Button } from "@/components/ui/button";

const POPULAR_PRESETS = [
  { name: "shadcn/ui", url: "shadcn-ui/ui", badge: "Trending" },
  { name: "Next.js", url: "vercel/next.js", badge: "Framework" },
  { name: "React", url: "facebook/react", badge: "Library" },
  { name: "Tailwind CSS", url: "tailwindlabs/tailwindcss", badge: "Utility" },
  { name: "Linux", url: "torvalds/linux", badge: "OS Kernel" },
];

const RECENTS_STORAGE_KEY = "gitstory_recents";
const RECENTS_EVENT = "gitstory-recents-updated";
const EMPTY_RECENTS: string[] = [];

let lastRecentsRaw: string | null = null;
let lastRecentsParsed: string[] = EMPTY_RECENTS;

function getRecentsSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY_RECENTS;
  try {
    const raw = localStorage.getItem(RECENTS_STORAGE_KEY);
    if (raw === lastRecentsRaw) {
      return lastRecentsParsed;
    }
    lastRecentsRaw = raw;
    if (!raw) {
      lastRecentsParsed = EMPTY_RECENTS;
      return EMPTY_RECENTS;
    }
    const parsed = JSON.parse(raw) as unknown;
    lastRecentsParsed = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 5)
      : EMPTY_RECENTS;
    return lastRecentsParsed;
  } catch {
    return EMPTY_RECENTS;
  }
}

function getRecentsServerSnapshot(): string[] {
  return EMPTY_RECENTS;
}

function subscribeRecents(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(RECENTS_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(RECENTS_EVENT, handler);
  };
}

interface RepoSearchInputProps {
  onSearch?: (owner: string, repo: string) => void;
  isLoading?: boolean;
  initialValue?: string;
  autoFocus?: boolean;
}

export function RepoSearchInput({
  onSearch,
  isLoading = false,
  initialValue = "",
  autoFocus = false,
}: RepoSearchInputProps) {
  const router = useRouter();
  const [inputVal, setInputVal] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const recentRepos = useSyncExternalStore(
    subscribeRecents,
    getRecentsSnapshot,
    getRecentsServerSnapshot
  );

  const navigateToRepo = (owner: string, repo: string) => {
    const slug = `${owner}/${repo}`;
    try {
      const existing = getRecentsSnapshot();
      const updated = Array.from(new Set([slug, ...existing])).slice(0, 5);
      localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(RECENTS_EVENT));
    } catch {
      // Ignore localStorage error
    }

    if (onSearch) {
      onSearch(owner, repo);
    } else {
      router.push(`/story/${owner}/${repo}`);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const parsed = parseRepoInput(inputVal);
    if (!parsed) {
      setError("Please enter a valid GitHub repository (e.g. facebook/react or full URL)");
      return;
    }

    navigateToRepo(parsed.owner, parsed.repo);
  };

  const handlePresetClick = (presetUrl: string) => {
    setInputVal(presetUrl);
    const parsed = parseRepoInput(presetUrl);
    if (parsed) {
      navigateToRepo(parsed.owner, parsed.repo);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="relative group" role="search">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 pointer-events-none group-focus-within:text-brand-400 transition-colors">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              if (error) setError(null);
            }}
            aria-label="GitHub repository URL or owner/repo"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "repo-search-error" : undefined}
            placeholder="Paste GitHub URL or type owner/repo (e.g. facebook/react)"
            autoFocus={autoFocus}
            className="w-full pl-12 pr-28 py-4 bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 text-base shadow-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 focus:outline-none transition-all duration-200"
          />

          <div className="absolute right-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="rounded-xl px-5 font-semibold"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {error && (
          <div
            id="repo-search-error"
            role="alert"
            className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-400">
        <span className="flex items-center gap-1 text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Try a classic:</span>
        </span>
        {POPULAR_PRESETS.map((preset) => (
          <button
            key={preset.url}
            type="button"
            onClick={() => handlePresetClick(preset.url)}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>{preset.name}</span>
            <span className="text-[10px] text-brand-300 bg-brand-500/20 px-1.5 py-0.5 rounded-full font-mono">
              {preset.badge}
            </span>
          </button>
        ))}
      </div>

      {recentRepos.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-slate-500">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Recent:</span>
          </span>
          {recentRepos.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => handlePresetClick(slug)}
              className="px-2.5 py-0.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-mono text-[11px] transition-colors"
            >
              {slug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
