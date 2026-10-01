import { expect, test } from "@playwright/test";
import { storageFor } from "./roles";

test.describe("syllabus mapping", () => {
  test.use({ storageState: storageFor("faculty") });

  test("shows the approved chapters and the coverage they give", async ({ page }) => {
    await page.goto("/faculty/units");
    await expect(page.getByRole("heading", { name: "Your units" })).toBeVisible();

    await page.locator('a[href^="/faculty/units/"]').first().click();

    await expect(page.getByRole("heading", { level: 1, name: /unit 1/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Suggested chapters" })).toBeVisible();
    await expect(page.getByText("Approved").first()).toBeVisible();

    await page.goto("/faculty/coverage");
    await expect(page.getByRole("heading", { name: "Coverage" })).toBeVisible();
    await expect(page.getByText(/of \d+ units/).first()).toBeVisible();
  });
});
