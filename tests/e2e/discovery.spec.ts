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

  test("reads cn as computer networks and says so", async ({ page }) => {
    await page.goto("/search?q=cn");
    await expect(page.getByRole("status").filter({ hasText: "computer networks" })).toBeVisible();
    await expect(
      page
        .locator('section[aria-labelledby="results-heading"]')
        .getByText(/network/i)
        .first(),
    ).toBeVisible();
  });

  test("turns a course code into the course and its prescribed books", async ({ page }) => {
    await page.goto("/search?q=UE24CS351A");
    const course = page.locator('section[aria-labelledby="course-heading"]');
    await expect(
      course.getByRole("heading", { name: "Database Management Systems" }),
    ).toBeVisible();
    await expect(course.getByRole("link", { name: "Database System Concepts" })).toBeVisible();
  });

  test("offers suggestions while typing and opens a course from them", async ({ page }) => {
    await page.goto("/search");
    const box = page.getByRole("combobox", { name: "What are you looking for?" });
    await box.fill("datab");
    const option = page.getByRole("option", { name: /Database Management Systems/ }).first();
    await expect(option).toBeVisible();
    await box.press("ArrowDown");
    await expect(box).toHaveAttribute("aria-activedescendant", /.+/);
  });

  test("an unknown address shows the not-found page with a way back", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "There is nothing on this shelf" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Search the catalogue" }).click();
    await expect(page).toHaveURL(/\/search$/);
  });
});

test.describe("not found inside the librarian's section", () => {
  test.use({ storageState: storageFor("librarian") });

  test("a missing book keeps the section's own header", async ({ page }) => {
    const response = await page.goto("/admin/catalog/999999");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "There is nothing on this shelf" }),
    ).toBeVisible();
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
  });
});
