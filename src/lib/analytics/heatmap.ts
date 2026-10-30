import { GitHubCommitSimple } from "../github/types";
import { HeatmapData, PunchcardCell, CalendarDay } from "./types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function computeHeatmap(commits: GitHubCommitSimple[]): HeatmapData {
  // Initialize 7x24 = 168 punchcard grid
  const punchcardGrid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  const dailyCounts: Map<string, number> = new Map();

  for (const c of commits) {
    const d = new Date(c.date);
    if (isNaN(d.getTime())) continue;

    const day = d.getUTCDay();
    const hour = d.getUTCHours();
    punchcardGrid[day][hour] += 1;

    // YYYY-MM-DD in UTC
    const dateKey = d.toISOString().split("T")[0];
    dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
  }

  // Find max punchcard cell count for intensity normalization
  let maxPunchCount = 0;
  let peakDay = 0;
  let peakHour = 0;

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const cnt = punchcardGrid[day][hour];
      if (cnt > maxPunchCount) {
        maxPunchCount = cnt;
        peakDay = day;
        peakHour = hour;
      }
    }
  }

  const punchcard: PunchcardCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const count = punchcardGrid[day][hour];
      punchcard.push({
        dayOfWeek: day,
        hour,
        count,
        intensity: maxPunchCount > 0 ? Number((count / maxPunchCount).toFixed(3)) : 0,
      });
    }
  }

  // Generate 52-week calendar grid (past 365 days up to today or latest commit)
  const now = new Date();
  const calendarDays: CalendarDay[] = [];
  let maxDaily = 0;
  const nonZeroCounts: number[] = [];

  // Generate 365 days
  for (let i = 364; i >= 0; i--) {
    const target = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = target.toISOString().split("T")[0];
    const count = dailyCounts.get(dateKey) || 0;

    if (count > maxDaily) {
      maxDaily = count;
    }
    if (count > 0) {
      nonZeroCounts.push(count);
    }
  }

  // Calculate quartiles for GitHub-style levels (0-4)
  nonZeroCounts.sort((a, b) => a - b);
  const q1 = nonZeroCounts.length > 0 ? nonZeroCounts[Math.floor(nonZeroCounts.length * 0.25)] || 1 : 1;
  const q2 = nonZeroCounts.length > 0 ? nonZeroCounts[Math.floor(nonZeroCounts.length * 0.50)] || 2 : 2;
  const q3 = nonZeroCounts.length > 0 ? nonZeroCounts[Math.floor(nonZeroCounts.length * 0.75)] || 4 : 4;

  for (let i = 364; i >= 0; i--) {
    const target = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = target.toISOString().split("T")[0];
    const count = dailyCounts.get(dateKey) || 0;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) {
      if (count <= q1) level = 1;
      else if (count <= q2) level = 2;
      else if (count <= q3) level = 3;
      else level = 4;
    }

    calendarDays.push({
      date: dateKey,
      count,
      level,
    });
  }

  // Compute streaks
  const sortedDates = Array.from(dailyCounts.keys()).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]).getTime();
      const curr = new Date(sortedDates[i]).getTime();
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  // Calculate active current streak leading up to today/yesterday
  const todayStr = now.toISOString().split("T")[0];
  const yesterdayStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  if (dailyCounts.has(todayStr) || dailyCounts.has(yesterdayStr)) {
    let checkDate = dailyCounts.has(todayStr) ? now : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    while (dailyCounts.has(checkDate.toISOString().split("T")[0])) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  return {
    punchcard,
    peakDay,
    peakDayName: DAY_NAMES[peakDay],
    peakHour,
    peakHourLabel: `${peakHour.toString().padStart(2, "0")}:00 UTC`,
    calendarDays,
    maxDailyCommits: maxDaily,
    totalActiveDays: dailyCounts.size,
    longestStreakDays: longestStreak,
    currentStreakDays: currentStreak,
  };
}

