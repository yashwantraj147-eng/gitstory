"use client";

import React from "react";
import { Award, Zap, Moon, Flame, Users, Tag, ShieldCheck } from "lucide-react";
import { RepoStoryPayload } from "@/lib/analytics/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface MilestoneBadgesProps {
  story: RepoStoryPayload;
}

export function MilestoneBadges({ story }: MilestoneBadgesProps) {
  const { metrics, contributors, milestones } = story;

  const badges = [
    {
      id: "century",
      label: "Century Club",
      description: "Over 100+ commits logged to the repository",
      achieved: metrics.totalCommitsAnalyzed >= 100,
      icon: ShieldCheck,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    },
    {
      id: "speed",
      label: "High Velocity",
      description: `Commit velocity of ${metrics.commitVelocityPerMonth} commits/month`,
      achieved: metrics.commitVelocityPerMonth >= 10,
      icon: Zap,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "night",
      label: "Night Owl Squad",
      description: `${metrics.nightOwlPercentage}% of code committed during vampire hours`,
      achieved: metrics.nightOwlPercentage >= 25,
      icon: Moon,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    },
    {
      id: "weekend",
      label: "Weekend Warrior",
      description: `${metrics.weekendHackerPercentage}% commits pushed on Saturdays and Sundays`,
      achieved: metrics.weekendHackerPercentage >= 20,
      icon: Flame,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    },
    {
      id: "releases",
      label: "Release Factory",
      description: `${metrics.releasesCount} releases tagged and shipped to production`,
      achieved: metrics.releasesCount >= 5,
      icon: Tag,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      id: "community",
      label: "Global Village",
      description: `Ecosystem powered by ${contributors.totalUniqueAuthors} distinct authors`,
      achieved: contributors.totalUniqueAuthors >= 10,
      icon: Users,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Repository Accolades</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Recognitions earned through commit patterns, consistency, and community scale
            </p>
          </div>
        </div>
      </CardHeader>

      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                badge.achieved
                  ? `${badge.color} shadow-sm`
                  : "bg-slate-950/20 border-slate-800/40 text-slate-600 opacity-50"
              }`}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-900/60 border border-current">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-sm font-bold tracking-tight text-slate-100">
                  {badge.label}
                </span>
                <span className="text-xs text-slate-400 leading-snug">
                  {badge.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

