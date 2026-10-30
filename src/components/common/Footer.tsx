import React from "react";
import { Heart, GitBranch } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-surface/40 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-brand-500" />
          <span>GitStory — Open-Source Repository Biographer</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          <span>using Next.js, Framer Motion, and Tailwind CSS</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            MIT License
          </a>
          <span>•</span>
          <a
            href="https://docs.github.com/en/rest"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            GitHub REST API
          </a>
        </div>
      </div>
    </footer>
  );
}

