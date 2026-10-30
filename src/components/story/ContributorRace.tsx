"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Users, Trophy, Award } from "lucide-react";
import { ContributorTimeline } from "@/lib/analytics/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContributorRaceProps {
  timeline: ContributorTimeline;
}

export function ContributorRace({ timeline }: ContributorRaceProps) {
  const { periods, buckets, topContributors, totalUniqueAuthors } = timeline;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentBucket = buckets[currentIndex] || buckets[0];
  const maxCommitCount = Math.max(
    1,
    ...buckets.map((b) => Math.max(1, ...b.ranks.map((r) => r.commits)))
  );

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= buckets.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 900 / playbackSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, buckets.length]);

  const handlePlayToggle = () => {
    if (currentIndex >= buckets.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  if (buckets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contributor Velocity</CardTitle>
        </CardHeader>
        <div className="p-8 text-center text-slate-500 text-sm">
          No contributor time-series data available for this repository.
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Top Contributors Race</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Watch the leaderboards evolve over time across {periods.length} monthly epochs ({totalUniqueAuthors} total authors)
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            title="Reset to beginning"
            className="p-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePlayToggle}
            className="px-4 font-semibold"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1" /> {currentIndex >= buckets.length - 1 ? "Replay" : "Play Race"}
              </>
            )}
          </Button>

          <button
            onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white border border-slate-700"
          >
            {playbackSpeed}x
          </button>
        </div>
      </CardHeader>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Race Chart Area */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          {/* Scrubber Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Timeline Position
            </span>
            <span className="text-lg font-mono font-bold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-lg border border-brand-500/20">
              {currentBucket?.period || "Start"}
            </span>
          </div>

          {/* Scrubber slider */}
          <div className="space-y-1.5">
            <input
              type="range"
              min={0}
              max={buckets.length - 1}
              value={currentIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentIndex(parseInt(e.target.value, 10));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>{periods[0]}</span>
              <span>{periods[periods.length - 1]}</span>
            </div>
          </div>

          {/* Bar Chart Race Rows */}
          <div className="space-y-3 pt-2 min-h-[360px]">
            {currentBucket?.ranks.slice(0, 7).map((item, rankIndex) => {
              const widthPct = Math.max(8, Math.round((item.commits / maxCommitCount) * 100));
              const medalColors = [
                "from-amber-500 to-yellow-400",
                "from-slate-300 to-slate-400",
                "from-amber-700 to-amber-600",
              ];
              const barGradient = rankIndex < 3 ? medalColors[rankIndex] : "from-brand-600 to-indigo-500";

              return (
                <div key={item.login} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 font-bold w-4 text-right">
                        #{rankIndex + 1}
                      </span>
                      {item.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.avatarUrl}
                          alt={item.login}
                          className="w-5 h-5 rounded-full border border-slate-700"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                          {item.login.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-slate-200">{item.login}</span>
                    </div>

                    <span className="font-mono text-slate-300 font-semibold">
                      {item.commits.toLocaleString()} commits
                    </span>
                  </div>

                  <div className="h-6 w-full bg-slate-950/60 rounded-md overflow-hidden p-0.5 border border-slate-800/80">
                    <motion.div
                      layout
                      initial={false}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className={`h-full rounded bg-gradient-to-r ${barGradient} shadow-md`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 10 All-Time Leaderboard */}
        <div className="lg:col-span-4 bg-slate-950/60 rounded-xl p-5 border border-slate-800/80 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-slate-100">
                All-Time Hall of Fame
              </h4>
            </div>

            <div className="space-y-3">
              {topContributors.slice(0, 8).map((c, i) => (
                <div
                  key={c.login}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 w-3">{i + 1}</span>
                    {c.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.avatarUrl}
                        alt={c.login}
                        className="w-5 h-5 rounded-full border border-slate-700"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-400">
                        {c.login.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="text-slate-200 font-medium truncate max-w-[110px]">
                      {c.login}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">{c.totalCommits.toLocaleString()}</span>
                    <span className="text-[10px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                      {c.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Unique contributors</span>
            <span className="font-mono font-bold text-slate-300">{totalUniqueAuthors.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

