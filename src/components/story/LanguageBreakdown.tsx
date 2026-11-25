"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Code2 } from "lucide-react";
import { LanguageBreakdownData } from "@/lib/analytics/types";
import { LANGUAGE_COLORS } from "@/lib/analytics/languages";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface LanguageBreakdownProps {
  data: LanguageBreakdownData;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LanguageBreakdown({ data }: LanguageBreakdownProps) {
  const { languages, primaryLanguage, totalBytes, timeline, timelineLanguages } = data;

  if (languages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Language Breakdown</CardTitle>
        </CardHeader>
        <div className="p-6 text-center text-slate-500 text-sm">
          No language metrics detected for this repository.
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Languages & File-Type Evolution</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Codebase composition totaling {formatBytes(totalBytes)} across {languages.length} languages
            </p>
          </div>
        </div>

        {primaryLanguage && (
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Primary:</span>
            <span className="font-semibold text-slate-200">{primaryLanguage}</span>
          </div>
        )}
      </CardHeader>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex shadow-inner border border-slate-800/80">
          {languages.map((lang) => (
            <div
              key={lang.name}
              style={{
                width: `${lang.percentage}%`,
                minWidth: lang.bytes > 0 ? "3px" : undefined,
                backgroundColor: lang.color,
              }}
              title={`${lang.name}: ${lang.percentage}% (${formatBytes(lang.bytes)})`}
              className="h-full transition-all hover:opacity-90 relative group"
            />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {languages.map((lang) => (
            <div
              key={lang.name}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/70 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span
                  style={{ backgroundColor: lang.color }}
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                />
                <span className="text-xs font-medium text-slate-200 truncate">{lang.name}</span>
              </div>

              <div className="flex flex-col items-end pl-2">
                <span className="text-xs font-mono font-bold text-slate-300">
                  {lang.percentage}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatBytes(lang.bytes)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {timeline && timeline.length > 1 && timelineLanguages && timelineLanguages.length > 0 && (
          <div className="pt-4 border-t border-slate-800/70 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Sampled File-Type Churn Over Time (Lines Changed)
              </h4>
              <span className="text-[11px] font-mono text-slate-500">By commit epoch</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  {timelineLanguages.map((langName) => {
                    const color = LANGUAGE_COLORS[langName] || "#6366f1";
                    return (
                      <Area
                        key={langName}
                        type="monotone"
                        dataKey={langName}
                        stackId="1"
                        stroke={color}
                        fill={color}
                        fillOpacity={0.35}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
