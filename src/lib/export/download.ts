import { RepoStoryPayload } from "../analytics/types";

export function downloadStoryJson(story: RepoStoryPayload): void {
  const jsonContent = JSON.stringify(story, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `gitstory-${story.repo.owner.login}-${story.repo.name}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function copyCurrentUrl(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}
