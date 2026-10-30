"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
  Activity,
  Flame,
  Moon,
  Award,
  Star,
  GitFork,
  Download,
  Share2,
} from "lucide-react";
import { RepoStoryPayload } from "@/lib/analytics/types";
import { soundEngine } from "@/lib/audio/synth";
import { Button } from "@/components/ui/button";

interface StoryWrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: RepoStoryPayload;
  onOpenExportCard: () => void;
}

const SLIDE_DURATION_MS = 6000;

export function StoryWrappedModal({
  isOpen,
  onClose,
  story,
  onOpenExportCard,
}: StoryWrappedModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const totalSlides = 5;
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { repo, metrics, heatmap, contributors, milestones, languages } = story;
  const topContributor = contributors.topContributors[0];
  const slumber = milestones.find((m) => m.type === "slumber");
  const monsterCommit = milestones.find((m) => m.type === "monster_commit");
  const goldenEra = milestones.find((m) => m.type === "golden_era");
  const birthYear = new Date(repo.created_at).getFullYear();

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#a855f7", "#ec4899", "#3b82f6", "#10b981"],
    });
  }, []);

  // Handle slide advance
  const nextSlide = useCallback(() => {
    soundEngine.playSlideTransition();
    setCurrentSlide((prev) => {
      if (prev >= totalSlides - 1) {
        return prev;
      }
      return prev + 1;
    });
    setProgress(0);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    soundEngine.playSlideTransition();
    setCurrentSlide((prev) => Math.max(0, prev - 1));
    setProgress(0);
  }, []);

  // Audio start/stop on open/close
  useEffect(() => {
    if (isOpen) {
      soundEngine.setMuted(isMuted);
      soundEngine.startBgm();
      soundEngine.playCelebrate();
      fireConfetti();
      setCurrentSlide(0);
      setProgress(0);
    } else {
      soundEngine.stopBgm();
    }

    return () => {
      soundEngine.stopBgm();
    };
  }, [isOpen, fireConfetti, isMuted]);

  // Slide-specific sound & effects
  useEffect(() => {
    if (!isOpen) return;

    if (currentSlide === 0 || currentSlide === 4) {
      fireConfetti();
      soundEngine.playCelebrate();
    }
  }, [currentSlide, isOpen, fireConfetti]);

  // Progress tick loop
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const intervalTime = 50;
    const step = (intervalTime / SLIDE_DURATION_MS) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentSlide < totalSlides - 1) {
            nextSlide();
            return 0;
          } else {
            return 100;
          }
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isOpen, isPaused, currentSlide, totalSlides, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, nextSlide, prevSlide]);

  if (!isOpen) return null;

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    soundEngine.setMuted(nextState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in select-none">
      <div className="relative w-full max-w-lg h-[92vh] max-h-[820px] bg-gradient-to-b from-[#0e1322] via-[#090d16] to-[#04060a] border border-slate-700/60 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Controls & Story Progress Bars */}
        <div className="relative z-20 px-6 pt-5 pb-3 space-y-3">
          {/* Progress segments */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, idx) => {
              let fillPct = 0;
              if (idx < currentSlide) fillPct = 100;
              else if (idx === currentSlide) fillPct = progress;

              return (
                <div
                  key={idx}
                  className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden"
                >
                  <div
                    style={{ width: `${fillPct}%` }}
                    className="h-full bg-gradient-to-r from-brand-400 to-indigo-300 rounded-full transition-all duration-75"
                  />
                </div>
              );
            })}
          </div>

          {/* Top Bar with branding & sound */}
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider font-mono text-brand-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GITSTORY WRAPPED</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono">{repo.name}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-full hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
                title={isMuted ? "Unmute Synthwave BGM" : "Mute Sound"}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-brand-400 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-full hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
                title="Close Wrapped"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Interactive Slide Area */}
        <div className="relative z-10 flex-1 px-8 py-4 flex flex-col justify-center items-center text-center">
          <AnimatePresence mode="wait">
            {/* Slide 1: Inception */}
            {currentSlide === 0 && (
              <motion.div
                key="slide-0"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 w-full"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-mono text-brand-300">
                  <span>CHAPTER 1: THE INCEPTION</span>
                </div>

                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={repo.owner.avatar_url}
                    alt={repo.owner.login}
                    className="w-24 h-24 rounded-3xl border-4 border-brand-500/30 mx-auto shadow-2xl"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-1.5 rounded-xl shadow-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    Born in {birthYear}
                  </h2>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                    {repo.name} was created by <strong className="text-slate-200">@{repo.owner.login}</strong> with a vision in {languages.primaryLanguage || "code"}.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">First Milestone</span>
                  <p className="text-xs text-slate-300 italic line-clamp-2">
                    &ldquo;{milestones[0]?.description || "Project initialized on GitHub."}&rdquo;
                  </p>
                </div>
              </motion.div>
            )}

            {/* Slide 2: The Rhythm of Dev */}
            {currentSlide === 1 && (
              <motion.div
                key="slide-1"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 w-full"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300">
                  <Activity className="w-3.5 h-3.5" />
                  <span>CHAPTER 2: CODE RHYTHM</span>
                </div>

                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  The Vampire Shift
                </h2>

                <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto">
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center space-y-2">
                    <Moon className="w-6 h-6 text-purple-400" />
                    <span className="text-2xl font-mono font-bold text-white">
                      {metrics.nightOwlPercentage}%
                    </span>
                    <span className="text-[11px] text-slate-400 text-center leading-tight">
                      Night Owl Commits (10 PM - 5 AM)
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center space-y-2">
                    <Flame className="w-6 h-6 text-rose-400" />
                    <span className="text-2xl font-mono font-bold text-white">
                      {metrics.weekendHackerPercentage}%
                    </span>
                    <span className="text-[11px] text-slate-400 text-center leading-tight">
                      Weekend Warriors (Sat & Sun)
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400">Peak Coding Hours:</span>
                  <p className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                    {heatmap.peakDayName}s at {heatmap.peakHourLabel}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Slide 3: Top Contributor Podium */}
            {currentSlide === 2 && (
              <motion.div
                key="slide-2"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 w-full"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>CHAPTER 3: HALL OF FAME</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    The Chief Architect
                  </h2>
                  <p className="text-xs text-slate-400">
                    Out of {contributors.totalUniqueAuthors} total contributors, one stood at the summit.
                  </p>
                </div>

                {topContributor && (
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 to-slate-900 border-2 border-amber-500/30 flex flex-col items-center space-y-3 max-w-xs mx-auto shadow-xl">
                    <div className="relative">
                      {topContributor.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={topContributor.avatarUrl}
                          alt={topContributor.login}
                          className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center text-xl font-bold text-amber-300 border-4 border-amber-400">
                          {topContributor.login.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -top-3 -right-2 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-md font-bold">
                        <Trophy className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="text-xl font-bold text-white tracking-tight">
                        @{topContributor.login}
                      </span>
                      <p className="text-xs font-mono text-amber-400 font-semibold mt-0.5">
                        {topContributor.totalCommits.toLocaleString()} commits ({topContributor.percentage}% volume)
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Slide 4: Turning Points & Chaos */}
            {currentSlide === 3 && (
              <motion.div
                key="slide-3"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-5 w-full"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-300">
                  <Flame className="w-3.5 h-3.5" />
                  <span>CHAPTER 4: WILD TURNING POINTS</span>
                </div>

                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  Highs, Lows & Crunch
                </h2>

                <div className="space-y-3 w-full max-w-sm mx-auto text-left">
                  {slumber ? (
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                      <Moon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white">The Great Hibernation</span>
                        <p className="text-[11px] text-slate-400">{slumber.description}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                      <Activity className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white">Nonstop Momentum</span>
                        <p className="text-[11px] text-slate-400">Zero long pauses recorded across {metrics.lifespanFormatted} of active development.</p>
                      </div>
                    </div>
                  )}

                  {goldenEra && (
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                      <Flame className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white">Sprint of Fire</span>
                        <p className="text-[11px] text-slate-400">{goldenEra.description}</p>
                      </div>
                    </div>
                  )}

                  {monsterCommit && (
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white">The Megacommit Overhaul</span>
                        <p className="text-[11px] text-slate-400">{monsterCommit.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Slide 5: The Grand Finale */}
            {currentSlide === 4 && (
              <motion.div
                key="slide-4"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 w-full"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-300">
                  <Award className="w-3.5 h-3.5" />
                  <span>THE GRAND FINALE</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    {repo.name} Wrapped
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    {metrics.lifespanFormatted} • {metrics.totalCommitsAnalyzed} Commits • {contributors.totalUniqueAuthors} Authors
                  </p>
                </div>

                {/* Scorecard Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-[#1e1b4b] border border-slate-700/80 max-w-sm mx-auto space-y-3 shadow-2xl">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Stargazers</span>
                      <p className="text-base font-mono font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {repo.stargazers_count.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Forks</span>
                      <p className="text-base font-mono font-bold text-blue-400 flex items-center justify-center gap-1 mt-0.5">
                        <GitFork className="w-3.5 h-3.5" />
                        {repo.forks_count.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 font-medium">
                    🏆 Project status: <strong className="text-brand-300">Legendary Open-Source Pillar</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      onClose();
                      onOpenExportCard();
                    }}
                    className="rounded-xl px-5 font-semibold"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    <span>Save Social Card</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Nav Buttons (Prev & Next Click Zones) */}
        <div className="relative z-20 px-6 py-4 flex items-center justify-between border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <span className="text-xs font-mono text-slate-500 font-semibold">
            {currentSlide + 1} / {totalSlides}
          </span>

          <button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

