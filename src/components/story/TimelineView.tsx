"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Trophy,
  Zap,
  Moon,
  Flame,
  Tag,
  Users,
  Filter,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Milestone, MilestoneType } from "@/lib/analytics/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimelineViewProps {
  milestones: Milestone[];
  repoFullName: string;
}

const ICON_MAP = {
  Sparkles,
  Trophy,
  Zap,
  Moon,
  Flame,
  Tag,
  Users,
};

export function TimelineView({ milestones, repoFullName }: TimelineViewProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = milestones.filter((m) => {
    if (filterType === "all") return true;
    if (filterType === "releases") return m.type === "release";
    if (filterType === "highlights") return m.type === "genesis" || m.type === "golden_era" || m.type === "monster_commit";
    if (filterType === "community") return m.type === "contributor_boom" || m.type === "century";
    return true;
  });

  return (
    <Card className="w-full relative">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Milestone Chronicle</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Auto-detected turning points, version releases, and historical spikes ({filtered.length} milestones)
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
          {[
            { id: "all", label: "All" },
            { id: "releases", label: "Releases" },
            { id: "highlights", label: "Key Highlights" },
            { id: "community", label: "Community" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterType === tab.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <div className="pt-8 px-2 sm:px-6 relative">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No milestones match the selected filter.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-6 space-y-8 pb-4">
            {filtered.map((item, index) => {
              const IconComponent = ICON_MAP[item.iconName] || Sparkles;
              const formattedDate = new Date(item.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
                  className="relative pl-7 sm:pl-9 group"
                >
                  {/* Timeline Node Point */}
                  <div
                    className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg ${item.badgeColor}`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {/* Card Content */}
                  <div className="bg-slate-900/80 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 sm:p-5 transition-all shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                          {formattedDate}
                        </span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                          {item.type.replace("_", " ")}
                        </span>
                      </div>

                      {item.metadata?.sha && (
                        <a
                          href={`https://github.com/${repoFullName}/commit/${item.metadata.sha}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-brand-300 transition-colors"
                        >
                          <span>{String(item.metadata.sha)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {item.metadata?.tag && (
                        <a
                          href={`https://github.com/${repoFullName}/releases/tag/${item.metadata.tag}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <span>tag: {String(item.metadata.tag)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-100 group-hover:text-brand-300 transition-colors">
                      {item.title}
                    </h4>

                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

