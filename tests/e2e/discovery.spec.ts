import { expect, test } from "@playwright/test";
import { storageFor } from "./roles";

test.describe("discovery", () => {
  test.use({ storageState: storageFor("student") });

  test("searches the shelves and opens a result", async ({ page }) => {
    await page.goto("/search?q=normalisation");
    await expect(page.getByRole("heading", { name: "Search the shelves" })).toBeVisible();

    const results = page.locator('section[aria-labelledby="results-heading"]');
    await expect(results).toBeVisible();

    const firstBook = results.locator('a[href^="/catalog/"]').first();
    await expect(firstBook).toBeVisible();
    await firstBook.click();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/\/catalog\/\d+/);
  });
});
