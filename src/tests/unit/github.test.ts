import { describe, it, expect } from "vitest";
import { parseRepoInput } from "@/lib/github/parsers";
import { MemoryCache } from "@/lib/github/cache";
import { RateLimitError, RepoNotFoundError, EmptyRepoError } from "@/lib/github/client";

describe("GitHub URL Parser", () => {
  it("parses full HTTPS URLs", () => {
    expect(parseRepoInput("https://github.com/facebook/react")).toEqual({
      owner: "facebook",
      repo: "react",
    });
  });

  it("parses URLs with trailing slash and .git", () => {
    expect(parseRepoInput("https://github.com/vercel/next.js.git/")).toEqual({
      owner: "vercel",
      repo: "next.js",
    });
  });

  it("parses shorthand owner/repo strings", () => {
    expect(parseRepoInput("torvalds/linux")).toEqual({
      owner: "torvalds",
      repo: "linux",
    });
  });

  it("strips subpaths like /tree/main/packages", () => {
    expect(parseRepoInput("https://github.com/tailwindlabs/tailwindcss/tree/main/packages")).toEqual({
      owner: "tailwindlabs",
      repo: "tailwindcss",
    });
  });

  it("returns null for invalid inputs", () => {
    expect(parseRepoInput("")).toBeNull();
    expect(parseRepoInput("just-a-word")).toBeNull();
    expect(parseRepoInput("https://gitlab.com/invalid")).toBeNull();
  });
});

describe("MemoryCache", () => {
  it("stores and retrieves items correctly", () => {
    const cache = new MemoryCache({ defaultTtlMs: 1000 });
    cache.set("key1", { data: "test" });
    expect(cache.get("key1")).toEqual({ data: "test" });
  });

  it("expires items after TTL", async () => {
    const cache = new MemoryCache({ defaultTtlMs: 20 });
    cache.set("expireKey", "expired");
    expect(cache.get("expireKey")).toBe("expired");

    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(cache.get("expireKey")).toBeNull();
  });

  it("evicts oldest items when maxItems is reached", () => {
    const cache = new MemoryCache({ maxItems: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3); // should evict 'a'

    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });
});

describe("GitHub Error Classes", () => {
  it("creates structured RateLimitError with countdown", () => {
    const resetDate = new Date(Date.now() + 15 * 60 * 1000);
    const error = new RateLimitError(resetDate, 60, 0);
    expect(error.status).toBe(429);
    expect(error.message).toContain("rate limit exceeded");
  });

  it("creates RepoNotFoundError with 404 status", () => {
    const error = new RepoNotFoundError("user", "missing-repo");
    expect(error.status).toBe(404);
    expect(error.message).toContain("was not found");
  });

  it("creates EmptyRepoError with 400 status", () => {
    const error = new EmptyRepoError("user", "empty-repo");
    expect(error.status).toBe(400);
  });
});

