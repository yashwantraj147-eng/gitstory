import { GitHubLanguages } from "../github/types";
import { LanguageBreakdownData, LanguageItem } from "./types";

const LANGUAGE_COLORS: Record<string, string> = {
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
  SQL: "#e38c00",
  Lua: "#000080",
  R: "#198CE7",
  Zig: "#ec915c",
};

export function computeLanguages(rawLanguages: GitHubLanguages): LanguageBreakdownData {
  const entries = Object.entries(rawLanguages || {});
  const totalBytes = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

  if (totalBytes === 0) {
    return {
      languages: [],
      primaryLanguage: null,
      totalBytes: 0,
    };
  }

  const languages: LanguageItem[] = entries
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: Number(((bytes / totalBytes) * 100).toFixed(1)),
      color: LANGUAGE_COLORS[name] || "#6366f1",
    }))
    .sort((a, b) => b.bytes - a.bytes);

  return {
    languages,
    primaryLanguage: languages.length > 0 ? languages[0].name : null,
    totalBytes,
  };
}
