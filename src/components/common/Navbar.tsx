"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Star, Zap, Github, RefreshCw } from "lucide-react";
import { RateLimitStatus } from "@/lib/github/types";

export function Navbar() {
  const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null);

  useEffect(() => {
    async function checkLimit() {
      try {
        const res = await fetch("/api/rate-limit");
        if (res.ok) {
          const data = (await res.json()) as RateLimitStatus;
          setRateLimit(data);
        }
      } catch {
        // Ignore rate limit check failures
      }
    }
    checkLimit();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <GitBranch className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-brand-300 transition-colors">
              GitStory
            </span>
            <span className="text-[10px] text-slate-400 font-mono -mt-1">
              Visual Repo Biographies
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {rateLimit && (
            <div
              title={`GitHub API remaining calls: ${rateLimit.remaining} / ${rateLimit.limit}. Resets at ${rateLimit.resetTimeFormatted}`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300"
            >
              <Zap className={`w-3.5 h-3.5 ${rateLimit.remaining < 10 ? "text-rose-400 animate-pulse" : "text-amber-400"}`} />
              <span className="font-mono">{rateLimit.remaining}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-500 font-mono">{rateLimit.limit} req/hr</span>
            </div>
          )}

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}

