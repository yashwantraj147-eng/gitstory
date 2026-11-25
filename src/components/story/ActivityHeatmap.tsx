"use client";

import React, { useState } from "react";
import { Activity, Clock, Flame, Calendar as CalendarIcon, Zap } from "lucide-react";
import { HeatmapData } from "@/lib/analytics/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityHeatmapProps {
  heatmap: HeatmapData;
}

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LEVEL_COLORS = [
  "bg-slate-900 border-slate-800",
  "bg-emerald-950 border-emerald-900",
  "bg-emerald-800 border-emerald-700",
  "bg-emerald-600 border-emerald-500",
  "bg-emerald-400 border-emerald-300",
];

export function ActivityHeatmap({ heatmap }: ActivityHeatmapProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "punchcard">("calendar");
  const [hoveredDate, setHoveredDate] = useState<{ date: string; count: number } | null>(null);
  const [hoveredPunch, setHoveredPunch] = useState<{ day: string; hour: number; count: number } | null>(null);

  const leadingSpacers = Math.max(0, Math.min(6, heatmap.startDayOfWeek ?? 0));

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Commit Rhythm & Heatmap</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Coding frequency mapped across {heatmap.calendarWindowLabel || "52 weeks"} and 24x7 hourly cycles
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Heatmap view switcher"
          className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "calendar"}
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "calendar"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>52-Week Grid</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "punchcard"}
            onClick={() => setActiveTab("punchcard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "punchcard"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>24x7 Punchcard</span>
          </button>
        </div>
      </CardHeader>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Peak Coding Hour
            </span>
            <span className="text-base font-mono font-bold text-emerald-400">
              {heatmap.peakHourLabel}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Busiest Day
            </span>
            <span className="text-base font-mono font-bold text-emerald-400">
              {heatmap.peakDayName}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Longest Streak
            </span>
            <span className="text-base font-mono font-bold text-amber-400 flex items-center gap-1">
              <Flame className="w-4 h-4 text-amber-400 inline" />
              <span>{heatmap.longestStreakDays} days</span>
            </span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Max Daily Sprints
            </span>
            <span className="text-base font-mono font-bold text-blue-400 flex items-center gap-1">
              <Zap className="w-4 h-4 text-blue-400 inline" />
              <span>{heatmap.maxDailyCommits} commits</span>
            </span>
          </div>
        </div>

        {activeTab === "calendar" && (
          <div className="space-y-3">
            <div className="overflow-x-auto pb-2 flex gap-2">
              <div className="grid grid-rows-7 gap-1 text-[10px] font-mono text-slate-500 pt-0.5 select-none">
                <span>Sun</span>
                <span className="opacity-0">Mon</span>
                <span>Tue</span>
                <span className="opacity-0">Wed</span>
                <span>Thu</span>
                <span className="opacity-0">Fri</span>
                <span>Sat</span>
              </div>
              <div
                role="grid"
                aria-label="52-week commit calendar"
                className="inline-grid grid-rows-7 grid-flow-col gap-1 min-w-[700px]"
              >
                {Array.from({ length: leadingSpacers }).map((_, idx) => (
                  <div key={`spacer-${idx}`} className="w-3 h-3" aria-hidden="true" />
                ))}
                {heatmap.calendarDays.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    aria-label={`${day.count} commit${day.count === 1 ? "" : "s"} on ${day.date}`}
                    onMouseEnter={() => setHoveredDate({ date: day.date, count: day.count })}
                    onMouseLeave={() => setHoveredDate(null)}
                    onFocus={() => setHoveredDate({ date: day.date, count: day.count })}
                    onBlur={() => setHoveredDate(null)}
                    className={`w-3 h-3 rounded-[2px] border transition-transform hover:scale-125 focus:scale-125 focus:outline-none focus:ring-1 focus:ring-emerald-300 cursor-pointer ${LEVEL_COLORS[day.level]}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              <div>
                {hoveredDate ? (
                  <span className="font-mono text-emerald-400 font-semibold">
                    {hoveredDate.count} commit{hoveredDate.count === 1 ? "" : "s"} on {hoveredDate.date}
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Hover or focus any day to inspect commit count ({heatmap.calendarWindowLabel || "Last 52 weeks"})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Less</span>
                {LEVEL_COLORS.map((col, idx) => (
                  <div key={idx} className={`w-3 h-3 rounded-[2px] border ${col}`} />
                ))}
                <span className="text-slate-500">More</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "punchcard" && (
          <div className="space-y-4">
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[650px] space-y-1">
                <div className="flex items-center text-[10px] font-mono text-slate-500 pl-10">
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="w-6 text-center">
                      {h % 3 === 0 ? h : ""}
                    </div>
                  ))}
                </div>

                {DAYS_SHORT.map((dayName, dayIndex) => (
                  <div key={dayName} className="flex items-center gap-2">
                    <span className="w-8 text-[11px] font-mono text-slate-400">{dayName}</span>
                    <div className="flex items-center">
                      {Array.from({ length: 24 }).map((_, hour) => {
                        const cell = heatmap.punchcard.find(
                          (p) => p.dayOfWeek === dayIndex && p.hour === hour
                        );
                        const count = cell?.count || 0;
                        const intensity = cell?.intensity || 0;

                        let bg = "bg-slate-900";
                        if (intensity > 0.75) bg = "bg-emerald-400";
                        else if (intensity > 0.45) bg = "bg-emerald-600";
                        else if (intensity > 0.15) bg = "bg-emerald-800";
                        else if (intensity > 0) bg = "bg-emerald-950";

                        return (
                          <button
                            key={hour}
                            type="button"
                            aria-label={`${dayName} at ${hour.toString().padStart(2, "0")}:00 UTC: ${count} commits`}
                            onMouseEnter={() => setHoveredPunch({ day: dayName, hour, count })}
                            onMouseLeave={() => setHoveredPunch(null)}
                            onFocus={() => setHoveredPunch({ day: dayName, hour, count })}
                            onBlur={() => setHoveredPunch(null)}
                            className="w-6 h-6 flex items-center justify-center p-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-300 rounded"
                          >
                            <div
                              style={{
                                transform: `scale(${Math.max(0.35, intensity)})`,
                              }}
                              className={`w-4 h-4 rounded-full transition-transform ${bg} hover:scale-110 shadow-sm`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/60 flex items-center justify-between">
              {hoveredPunch ? (
                <span className="font-mono text-emerald-400 font-semibold">
                  {hoveredPunch.day} at {hoveredPunch.hour.toString().padStart(2, "0")}:00 UTC —{" "}
                  {hoveredPunch.count} commits
                </span>
              ) : (
                <span className="text-slate-500">
                  Hover or focus punch circles to see hourly intensity
                </span>
              )}
              <span className="text-slate-500 font-mono text-[11px]">UTC Timestamps</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
