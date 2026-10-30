import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const artifactDir = "C:\\Users\\yashw\\.gemini\\antigravity\\brain\\f7454d87-e340-4806-bf2f-3e4c05f3574d";

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Home Page
  console.log("Navigating to home page http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const homePath = path.join(artifactDir, "screenshot-home.png");
  await page.screenshot({ path: homePath, fullPage: true });
  console.log("Saved home page screenshot:", homePath);

  // 2. Story Page for real repo (shadcn-ui/ui)
  console.log("Navigating to story page http://localhost:3000/story/shadcn-ui/ui...");
  await page.goto("http://localhost:3000/story/shadcn-ui/ui", { waitUntil: "networkidle" });

  // Wait for the story content to render
  await page.waitForSelector("h1", { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Verify elements are present
  const title = await page.textContent("h1");
  console.log("Rendered story title:", title);

  const storyPath = path.join(artifactDir, "screenshot-story-dashboard.png");
  await page.screenshot({ path: storyPath, fullPage: true });
  console.log("Saved story dashboard screenshot:", storyPath);

  // 3. Export Modal
  console.log("Opening Export Modal...");
  const exportBtn = page.getByRole("button", { name: "Export Card" });
  if (await exportBtn.isVisible()) {
    await exportBtn.click();
    await page.waitForTimeout(1000);
    const modalPath = path.join(artifactDir, "screenshot-export-card.png");
    await page.screenshot({ path: modalPath });
    console.log("Saved export card screenshot:", modalPath);
  }

  await browser.close();
  console.log("Browser verification finished successfully!");
}

main().catch((err) => {
  console.error("Browser verification failed:", err);
  process.exit(1);
});

