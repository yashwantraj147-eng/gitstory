"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, Terminal, Laugh, CheckCircle2, ChevronRight, Award, Loader2 } from "lucide-react";
import { StoryNarrative as StoryNarrativeType, RepoStoryPayload } from "@/lib/analytics/types";
import { TemplateNarrativeEngine } from "@/lib/narrative/templateEngine";
import { NarrativeTone } from "@/lib/narrative/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StoryNarrativeProps {
  initialNarrative: StoryNarrativeType;
  storyPayload: RepoStoryPayload;
}

export function StoryNarrative({ initialNarrative, storyPayload }: StoryNarrativeProps) {
  const [currentTone, setCurrentTone] = useState<NarrativeTone>(
    initialNarrative.tone || "storyteller"
  );
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [narrativesByTone, setNarrativesByTone] = useState<Partial<Record<NarrativeTone, StoryNarrativeType>>>({
    [initialNarrative.tone || "storyteller"]: initialNarrative,
  });
  const [isGeneratingTone, setIsGeneratingTone] = useState(false);

  const templateEngine = useMemo(() => new TemplateNarrativeEngine(), []);

  const narrativeContext = useMemo(
    () => ({
      repo: storyPayload.repo,
      metrics: storyPayload.metrics,
      milestones: storyPayload.milestones,
      heatmap: storyPayload.heatmap,
      contributors: storyPayload.contributors,
      languages: storyPayload.languages,
    }),
    [storyPayload]
  );

  const narrative = useMemo(() => {
    const cached = narrativesByTone[currentTone];
    if (cached) return cached;
    return templateEngine.generate(narrativeContext, currentTone);
  }, [narrativesByTone, currentTone, templateEngine, narrativeContext]);

  const handleToneChange = async (tone: NarrativeTone) => {
    setCurrentTone(tone);
    setActiveChapterIndex(0);

    if (narrativesByTone[tone]) {
      return;
    }

    // Request AI narrative for the newly selected tone if AI mode was active; fall back silently to template
    if (initialNarrative.generatedBy === "ai") {
      try {
        setIsGeneratingTone(true);
        const res = await fetch("/api/narrative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: narrativeContext, tone }),
        });
        if (res.ok) {
          const json = (await res.json()) as { data?: StoryNarrativeType };
          if (json.data) {
            setNarrativesByTone((prev) => ({ ...prev, [tone]: json.data }));
            return;
          }
        }
      } catch {
        // Fallback to client template below
      } finally {
        setIsGeneratingTone(false);
      }
    }

    const fallback = templateEngine.generate(narrativeContext, tone);
    setNarrativesByTone((prev) => ({ ...prev, [tone]: fallback }));
  };

  const activeChapter = narrative.chapters[activeChapterIndex] || narrative.chapters[0];

  return (
    <Card className="relative overflow-hidden border-brand-500/30 bg-gradient-to-b from-slate-900/90 to-surface/90 shadow-2xl">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shadow-inner">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold text-white">{narrative.title}</CardTitle>
              <Badge variant={narrative.generatedBy === "ai" ? "purple" : "outline"} className="text-[10px]">
                {narrative.generatedBy === "ai" ? "AI Crafted" : "Smart Template"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{narrative.subtitle}</p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Narrative tone"
          className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800"
        >
          {[
            { id: "storyteller" as const, label: "Storyteller", icon: Sparkles, activeClass: "bg-brand-600 text-white shadow-md shadow-brand-500/20" },
            { id: "chronicle" as const, label: "Chronicle", icon: Terminal, activeClass: "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" },
            { id: "humorous" as const, label: "Humorous", icon: Laugh, activeClass: "bg-amber-600 text-white shadow-md shadow-amber-500/20" },
          ].map((toneOpt) => {
            const Icon = toneOpt.icon;
            const selected = currentTone === toneOpt.id;
            return (
              <button
                key={toneOpt.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => void handleToneChange(toneOpt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selected ? toneOpt.activeClass : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{toneOpt.label}</span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div role="tablist" aria-label="Story chapters" className="lg:col-span-4 flex flex-col gap-2">
          {narrative.chapters.map((ch, idx) => {
            const isSelected = idx === activeChapterIndex;
            return (
              <button
                key={ch.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
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
                  <span className="text-sm font-medium line-clamp-1">{ch.title}</span>
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

        <div className="lg:col-span-8 flex flex-col justify-between bg-slate-950/60 rounded-xl p-6 border border-slate-800/80">
          {isGeneratingTone ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              <span>Rewriting story in {currentTone} tone...</span>
            </div>
          ) : (
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
                    <span>
                      {narrative.generatedBy === "ai"
                        ? "Generated by configured AI provider"
                        : "Synthesized from git history analysis"}
                    </span>
                  </span>
                  <span className="font-mono">
                    Chapter {activeChapterIndex + 1} of {narrative.chapters.length}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </Card>
  );
}
