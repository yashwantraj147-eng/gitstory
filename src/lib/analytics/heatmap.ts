import { GitHubCommitSimple } from "../github/types";
import { HeatmapData, PunchcardCell, CalendarDay } from "./types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeHeatmap(commits: GitHubCommitSimple[]): HeatmapData {
  // Initialize 7x24 = 168 punchcard grid
  const punchcardGrid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  const dailyCounts: Map<string, number> = new Map();
  let latestCommitMs = 0;

  for (const c of commits) {
    const d = new Date(c.date);
    if (isNaN(d.getTime())) continue;

    if (d.getTime() > latestCommitMs) {
      latestCommitMs = d.getTime();
    }

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

  // Anchor 52-week calendar window: use `now` for active repos, or latest commit date if archived > 365 days ago
  const now = new Date();
  const isArchivedWindow = latestCommitMs > 0 && now.getTime() - latestCommitMs > 365 * MS_PER_DAY;
  const anchorEnd = isArchivedWindow ? new Date(latestCommitMs) : now;
  const calendarWindowLabel = isArchivedWindow
    ? `Final active 52 weeks (ended ${anchorEnd.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
      })})`
    : "Last 52 weeks";

  const calendarDays: CalendarDay[] = [];
  let maxDaily = 0;
  const nonZeroCounts: number[] = [];

  for (let i = 364; i >= 0; i--) {
    const target = new Date(anchorEnd.getTime() - i * MS_PER_DAY);
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
  const q2 = nonZeroCounts.length > 0 ? nonZeroCounts[Math.floor(nonZeroCounts.length * 0.5)] || 2 : 2;
  const q3 = nonZeroCounts.length > 0 ? nonZeroCounts[Math.floor(nonZeroCounts.length * 0.75)] || 4 : 4;

  const firstCalendarDate = new Date(anchorEnd.getTime() - 364 * MS_PER_DAY);
  const startDayOfWeek = firstCalendarDate.getUTCDay();

  for (let i = 364; i >= 0; i--) {
    const target = new Date(anchorEnd.getTime() - i * MS_PER_DAY);
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

  // Compute streaks across UTC dates
  const sortedDates = Array.from(dailyCounts.keys()).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = Date.parse(`${sortedDates[i - 1]}T00:00:00Z`);
      const curr = Date.parse(`${sortedDates[i]}T00:00:00Z`);
      const diffDays = Math.round((curr - prev) / MS_PER_DAY);

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
  const yesterdayStr = new Date(now.getTime() - MS_PER_DAY).toISOString().split("T")[0];
  if (dailyCounts.has(todayStr) || dailyCounts.has(yesterdayStr)) {
    let checkDate = dailyCounts.has(todayStr) ? now : new Date(now.getTime() - MS_PER_DAY);
    while (dailyCounts.has(checkDate.toISOString().split("T")[0])) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - MS_PER_DAY);
    }
  }

  return {
    punchcard,
    peakDay,
    peakDayName: DAY_NAMES[peakDay],
    peakHour,
    peakHourLabel: `${peakHour.toString().padStart(2, "0")}:00 UTC`,
    calendarDays,
    calendarWindowLabel,
    startDayOfWeek,
    maxDailyCommits: maxDaily,
    totalActiveDays: dailyCounts.size,
    longestStreakDays: longestStreak,
    currentStreakDays: currentStreak,
  };
}
