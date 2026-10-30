"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  GitBranch,
  Calendar,
  Trophy,
  Activity,
  Code2,
  Share2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { RepoSearchInput } from "@/components/common/RepoSearchInput";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (owner: string, repo: string) => {
    setIsLoading(true);
    router.push(`/story/${owner}/${repo}`);
  };

  const features = [
    {
      icon: Calendar,
      title: "Animated Milestone Timeline",
      description: "Auto-detects genesis commits, century milestones, hibernation gaps, and peak sprint velocity.",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: Trophy,
      title: "Contributor Bar Race",
      description: "Watch contributor leaderboards dynamically shift over monthly epochs with interactive playback.",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: Activity,
      title: "Commit Rhythm & Heatmaps",
      description: "GitHub-style 52-week calendar grid and 24x7 punchcard uncovering peak coding hours.",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: Code2,
      title: "Architecture & Languages",
      description: "Track code distribution across languages with GitHub-standard color mapping and byte breakdowns.",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      icon: Sparkles,
      title: "Multi-Tone AI Narratives",
      description: "Read repo biographies rendered in Storyteller, Tech Chronicle, or Humorous Hacker styles.",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: Share2,
      title: "Instant Export & Sharing",
      description: "Generate 1200x630 social media PNG cards, copy shareable deep links, or download raw JSON analytics.",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-16 sm:space-y-24 py-6 sm:py-12">
      {/* Hero Section */}
      <div className="w-full text-center space-y-6 max-w-4xl mx-auto relative">
        {/* Decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-300 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
          <span>Interactive Historical Visualizer for GitHub Repos</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none">
          Every repository has a <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">story</span> to tell.
        </h1>

        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Transform any public GitHub repository into an interactive historical narrative—featuring animated milestones, contributor race charts, activity heatmaps, and AI-crafted biographies.
        </p>

        {/* Search Bar */}
        <div className="pt-4">
          <RepoSearchInput onSearch={handleSearch} isLoading={isLoading} autoFocus />
        </div>
      </div>

      {/* Feature Pillars Grid */}
      <div className="w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Uncover the Anatomy of Open-Source Projects
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            From the initial genesis commit to thousands of merged pull requests, explore repository history with rich interactive graphics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} glow className="p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${f.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center text-xs font-semibold text-brand-400 group-hover:text-brand-300">
                  <span>Interactive Visualization</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

