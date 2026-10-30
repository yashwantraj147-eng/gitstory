export interface ParsedRepo {
  owner: string;
  repo: string;
}

/**
 * Parses user input into normalized owner and repository names.
 * Supports:
 * - "https://github.com/facebook/react"
 * - "http://github.com/facebook/react.git"
 * - "github.com/facebook/react"
 * - "facebook/react"
 * - "https://github.com/facebook/react/tree/main/packages"
 */
export function parseRepoInput(input: string): ParsedRepo | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  let trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // Remove trailing slashes first
  trimmed = trimmed.replace(/\/+$/, "");

  // Check if it's an external domain other than github.com
  const hasOtherDomain = /^(https?:\/\/)?(?!github\.com\/)([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/|$)/i.test(trimmed);
  if (hasOtherDomain && !trimmed.startsWith("github.com/")) {
    return null;
  }

  // Remove trailing .git
  trimmed = trimmed.replace(/\.git$/i, "");

  // Remove protocol
  let clean = trimmed.replace(/^https?:\/\//i, "");

  // Remove github.com prefix if present
  clean = clean.replace(/^(www\.)?github\.com\//i, "");

  // Strip anything after branch or tree paths (e.g. /tree/main/...)
  const parts = clean.split("/").filter(Boolean);

  if (parts.length >= 2) {
    const owner = parts[0];
    let repo = parts[1];

    // Remove any remaining .git on repo
    repo = repo.replace(/\.git$/i, "");

    // Validate standard GitHub username and repo naming conventions
    const isValidOwner = /^[a-zA-Z0-9_\-\.]+$/.test(owner);
    const isValidRepo = /^[a-zA-Z0-9_\-\.]+$/.test(repo);

    if (isValidOwner && isValidRepo) {
      return { owner, repo };
    }
  }

  return null;
}
