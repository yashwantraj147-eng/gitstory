import { test, expect } from "@playwright/test";

test.describe("GitStory End-to-End User Flow", () => {
  test("renders home page with search input and preset buttons", async ({ page }) => {
    await page.goto("/");

    // Verify Title and Subtitle
    await expect(page.locator("h1")).toContainText("Every repository has a story to tell");
    await expect(page.locator("input[placeholder*='GitHub']")).toBeVisible();

    // Verify classic preset buttons
    await expect(page.getByRole("button", { name: "shadcn/ui" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next.js" })).toBeVisible();
  });

  test("can navigate to a story page and display visual components", async ({ page }) => {
    // Navigate directly to a demo or test repository story
    await page.goto("/story/facebook/react");

    // Expect loading state or content
    await page.waitForSelector("h1", { timeout: 30000 });

    // Verify Header or Rate Limit error is handled gracefully without crash
    const heading = await page.locator("h1, h2").first().textContent();
    expect(heading).toBeTruthy();
  });
});

