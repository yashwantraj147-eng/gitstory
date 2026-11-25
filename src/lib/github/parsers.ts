export interface ParsedRepo {
  owner: string;
  repo: string;
}

/**
 * Parses user input into normalized owner and repository names.
 * Supports:
 * - "https://github.com/facebook/react"
 * - "https://www.github.com/facebook/react?tab=readme-ov-file#react"
 * - "http://github.com/facebook/react.git/"
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

  // Strip query string and hash fragment before normalizing paths
  trimmed = trimmed.split(/[?#]/)[0].replace(/\/+$/, "");
  if (!trimmed) {
    return null;
  }

  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");

  // Reject URLs pointing to non-github.com hosts (including subdomains like gist.github.com)
  const firstSegment = withoutProtocol.split("/")[0] || "";
  if (
    (hasProtocol || firstSegment.includes(".")) &&
    !/^(www\.)?github\.com$/i.test(firstSegment)
  ) {
    return null;
  }

  // Remove github.com prefix if present
  const clean = withoutProtocol.replace(/^(www\.)?github\.com\/?/i, "");
  const parts = clean.split("/").filter(Boolean);

  if (parts.length >= 2) {
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");

    if (!owner || !repo || owner === "." || owner === ".." || repo === "." || repo === "..") {
      return null;
    }

    // Validate standard GitHub username and repo naming conventions
    const isValidOwner = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]{0,38})$/.test(owner);
    const isValidRepo = /^[a-zA-Z0-9._-]+$/.test(repo);

    if (isValidOwner && isValidRepo) {
      return { owner, repo };
    }
  }

  return null;
}
