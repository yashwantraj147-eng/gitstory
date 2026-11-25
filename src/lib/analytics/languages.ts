import { GitHubCommitSimple, GitHubLanguages } from "../github/types";
import { LanguageBreakdownData, LanguageItem, LanguageTimelinePoint } from "./types";

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  "C++": "#f34b7d",
  C: "#555555",
  Java: "#b07219",
  "C#": "#178600",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  PHP: "#4F5D95",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Dart: "#00B4AB",
  Markdown: "#083fa1",
  Docs: "#38bdf8",
  Config: "#94a3b8",
  SQL: "#e38c00",
  Lua: "#000080",
  R: "#198CE7",
  Zig: "#ec915c",
  Other: "#64748b",
};

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  mts: "TypeScript",
  cts: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  py: "Python",
  rs: "Rust",
  go: "Go",
  cpp: "C++",
  cc: "C++",
  cxx: "C++",
  hpp: "C++",
  c: "C",
  h: "C",
  java: "Java",
  cs: "C#",
  html: "HTML",
  htm: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "SCSS",
  sh: "Shell",
  bash: "Shell",
  rb: "Ruby",
  swift: "Swift",
  kt: "Kotlin",
  php: "PHP",
  vue: "Vue",
  svelte: "Svelte",
  dart: "Dart",
  md: "Markdown",
  mdx: "Markdown",
  sql: "SQL",
  lua: "Lua",
  r: "R",
  zig: "Zig",
  json: "Config",
  yaml: "Config",
  yml: "Config",
  toml: "Config",
};

function classifyFilename(filename: string): string {
  const base = filename.split("/").pop() || filename;
  const dotIdx = base.lastIndexOf(".");
  if (dotIdx <= 0 || dotIdx === base.length - 1) {
    return "Other";
  }
  const ext = base.slice(dotIdx + 1).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] || "Other";
}

export function computeLanguages(
  rawLanguages: GitHubLanguages,
  commits?: GitHubCommitSimple[]
): LanguageBreakdownData {
  const entries = Object.entries(rawLanguages || {});
  const totalBytes = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

  const languages: LanguageItem[] =
    totalBytes > 0
      ? entries
          .map(([name, bytes]) => ({
            name,
            bytes,
            percentage: Number(((bytes / totalBytes) * 100).toFixed(1)),
            color: LANGUAGE_COLORS[name] || "#6366f1",
          }))
          .sort((a, b) => b.bytes - a.bytes)
      : [];

  // Compute language / file-type evolution over time from commits that include file metadata
  let timeline: LanguageTimelinePoint[] | undefined;
  let timelineLanguages: string[] | undefined;

  if (commits && commits.length > 0) {
    const periodMap = new Map<string, Map<string, number>>();
    const overallLangCounts = new Map<string, number>();

    for (const commit of commits) {
      if (!commit.files || commit.files.length === 0) continue;
      const period = commit.date.slice(0, 7); // YYYY-MM
      if (!periodMap.has(period)) {
        periodMap.set(period, new Map());
      }
      const bucket = periodMap.get(period)!;

      for (const file of commit.files) {
        const lang = classifyFilename(file.filename);
        const weight = Math.max(1, file.changes);
        bucket.set(lang, (bucket.get(lang) || 0) + weight);
        overallLangCounts.set(lang, (overallLangCounts.get(lang) || 0) + weight);
      }
    }

    if (periodMap.size > 0) {
      const topFileTypes = Array.from(overallLangCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      const sortedPeriods = Array.from(periodMap.keys()).sort();
      timelineLanguages = topFileTypes;
      timeline = sortedPeriods.map((period) => {
        const bucket = periodMap.get(period)!;
        const point: LanguageTimelinePoint = { period };
        for (const lang of topFileTypes) {
          point[lang] = bucket.get(lang) || 0;
        }
        return point;
      });
    }
  }

  return {
    languages,
    primaryLanguage: languages.length > 0 ? languages[0].name : null,
    totalBytes,
    timeline,
    timelineLanguages,
  };
}
