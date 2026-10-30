"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, Terminal, Laugh, CheckCircle2, ChevronRight, Award } from "lucide-react";
import { StoryNarrative as StoryNarrativeType, RepoStoryPayload } from "@/lib/analytics/types";
import { TemplateNarrativeEngine } from "@/lib/narrative/templateEngine";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StoryNarrativeProps {
  initialNarrative: StoryNarrativeType;
  storyPayload: RepoStoryPayload;
}

export function StoryNarrative({ initialNarrative, storyPayload }: StoryNarrativeProps) {
  const [currentTone, setCurrentTone] = useState<"storyteller" | "chronicle" | "humorous">(
    initialNarrative.tone || "storyteller"
  );
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  // Compute narrative on tone change
  const engine = new TemplateNarrativeEngine();
  const narrative = engine.generate({
    repo: storyPayload.repo,
    metrics: storyPayload.metrics,
    milestones: storyPayload.milestones,
    heatmap: storyPayload.heatmap,
    contributors: storyPayload.contributors,
    languages: storyPayload.languages,
  }, currentTone);

  const activeChapter = narrative.chapters[activeChapterIndex] || narrative.chapters[0];

  const toneIcons = {
    storyteller: Sparkles,
    chronicle: Terminal,
    humorous: Laugh,
  };

  const ActiveIcon = toneIcons[currentTone];

  return (
    <Card className="relative overflow-hidden border-brand-500/30 bg-gradient-to-b from-slate-900/90 to-surface/90 shadow-2xl">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shadow-inner">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white">
              {narrative.title}
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              {narrative.subtitle}
            </p>
          </div>
        </div>

        {/* Tone Selector */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCurrentTone("storyteller")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTone === "storyteller"
                ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Storyteller</span>
          </button>
          <button
            onClick={() => setCurrentTone("chronicle")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTone === "chronicle"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Chronicle</span>
          </button>
          <button
            onClick={() => setCurrentTone("humorous")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTone === "humorous"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Laugh className="w-3.5 h-3.5" />
            <span>Humorous</span>
          </button>
        </div>
      </CardHeader>

      <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chapter Navigation Tabs */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          {narrative.chapters.map((ch, idx) => {
            const isSelected = idx === activeChapterIndex;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChapterIndex(idx)}
                className={`text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                  isSelected
                    ? "bg-slate-800/90 border-brand-500/50 text-white shadow-lg shadow-brand-500/5 translate-x-1"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-300"
                }`}
              >
                <div className="flex flex-col space-y-1">
                  <span className="text-[11px] font-mono font-semibold text-brand-400">
                    {ch.timeframe}
                  </span>
                  <span className="text-sm font-medium line-clamp-1">
                    {ch.title}
                  </span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 mt-1 transition-transform ${
                    isSelected ? "text-brand-400 translate-x-1" : "text-slate-600"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Active Chapter Content */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-slate-950/60 rounded-xl p-6 border border-slate-800/80">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentTone}-${activeChapter.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="blue" className="text-xs">
                    {activeChapter.timeframe}
                  </Badge>
                  <h4 className="text-base sm:text-lg font-bold text-slate-100">
                    {activeChapter.title}
                  </h4>
                </div>
                {activeChapter.highlightMetric && (
                  <div className="flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/30 px-2.5 py-1 rounded-full text-xs font-semibold text-brand-300">
                    <Award className="w-3.5 h-3.5 text-brand-400" />
                    <span>{activeChapter.highlightMetric}</span>
                  </div>
                )}
              </div>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed tracking-wide font-normal">
                {activeChapter.content}
              </p>

              <div className="pt-4 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Synthesized from git history analysis</span>
                </span>
                <span className="font-mono">Chapter {activeChapterIndex + 1} of {narrative.chapters.length}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}

