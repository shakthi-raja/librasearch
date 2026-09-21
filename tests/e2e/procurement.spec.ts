import { expect, test } from "@playwright/test";
import { storageFor } from "./roles";

test.describe("procurement", () => {
  test.use({ storageState: storageFor("librarian") });

  test("flags a duplicate ISBN and records the approval", async ({ page }) => {
    const title = `Database Systems e2e ${Date.now()}`;

    await page.goto("/admin/procurement");
    await expect(page.getByRole("heading", { name: "Procurement" })).toBeVisible();

    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Author").fill("Silberschatz");
    await page.getByLabel("ISBN-13").fill("9780078022159");
    await page
      .getByLabel("Why the library should buy it")
      .fill("Another desk copy for the e2e run.");
    await page.getByRole("button", { name: "Log request" }).click();

    const pending = page.locator('section[aria-labelledby="pending-heading"]');
    const row = pending.locator("tr", { hasText: title });
    await expect(row.getByText("Same ISBN already catalogued")).toBeVisible();

    await row.getByPlaceholder("Note (required to reject)").fill("Approved during the e2e run.");
    await row.getByRole("button", { name: "Approve" }).click();

    const decided = page.locator('section[aria-labelledby="decided-heading"]');
    const decidedRow = decided.locator("tr", { hasText: title });
    await expect(decidedRow.getByText("APPROVED", { exact: true }).first()).toBeVisible();
  });
});
