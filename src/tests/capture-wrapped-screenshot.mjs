import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const outputDir =
  process.env.SCREENSHOT_DIR || path.resolve(process.cwd(), "test-results", "screenshots");

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log("Launching browser for Wrapped verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("Opening story page...");
  await page.goto("http://localhost:3000/story/shadcn-ui/ui", { waitUntil: "networkidle" });
  await page.waitForSelector("h1", { timeout: 30000 });

  const wrappedBtn = page.getByRole("button", { name: /Launch Wrapped/i });
  await wrappedBtn.click();
  await page.waitForTimeout(1500);

  const slide1Path = path.join(outputDir, "screenshot-wrapped-story.png");
  await page.screenshot({ path: slide1Path });
  console.log("Saved Wrapped Slide 1 screenshot:", slide1Path);

  const nextBtn = page.getByRole("button", { name: "Next" });
  await nextBtn.click();
  await page.waitForTimeout(600);
  await nextBtn.click();
  await page.waitForTimeout(1000);

  const podiumPath = path.join(outputDir, "screenshot-wrapped-podium.png");
  await page.screenshot({ path: podiumPath });
  console.log("Saved Wrapped Podium screenshot:", podiumPath);

  await browser.close();
  console.log("Wrapped verification completed successfully!");
}

main().catch((err) => {
  console.error("Wrapped screenshot capture failed:", err);
  process.exit(1);
});
