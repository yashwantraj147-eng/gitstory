import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const outputDir =
  process.env.SCREENSHOT_DIR || path.resolve(process.cwd(), "test-results", "screenshots");

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("Navigating to home page http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const homePath = path.join(outputDir, "screenshot-home.png");
  await page.screenshot({ path: homePath, fullPage: true });
  console.log("Saved home page screenshot:", homePath);

  console.log("Navigating to story page http://localhost:3000/story/shadcn-ui/ui...");
  await page.goto("http://localhost:3000/story/shadcn-ui/ui", { waitUntil: "networkidle" });
  await page.waitForSelector("h1", { timeout: 30000 });
  await page.waitForTimeout(2000);

  const title = await page.textContent("h1");
  console.log("Rendered story title:", title);

  const storyPath = path.join(outputDir, "screenshot-story-dashboard.png");
  await page.screenshot({ path: storyPath, fullPage: true });
  console.log("Saved story dashboard screenshot:", storyPath);

  console.log("Opening Export Modal...");
  const exportBtn = page.getByRole("button", { name: "Export Card" });
  if (await exportBtn.isVisible()) {
    await exportBtn.click();
    await page.waitForTimeout(1000);
    const modalPath = path.join(outputDir, "screenshot-export-card.png");
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
