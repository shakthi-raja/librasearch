import { expect, test } from "@playwright/test";

test.describe("guest catalogue", () => {
  test("browses a subject and opens a book", async ({ page }) => {
    await page.goto("/catalog");

    await expect(page.getByRole("heading", { name: "Catalogue", level: 1 })).toBeVisible();
    await page.getByRole("link", { name: /^Databases/ }).click();

    await expect(page).toHaveURL(/category=databases/);
    await expect(page.getByRole("heading", { name: "Databases", level: 1 })).toBeVisible();

    await page.getByRole("link", { name: "Database System Concepts" }).click();

    await expect(
      page.getByRole("heading", { name: "Database System Concepts", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "7th edition, 2019" })).toBeVisible();
    await expect(page.getByText("Relational Database Design").first()).toBeVisible();
  });

  test("searches for normal forms and finds the normalisation chapter", async ({ page }) => {
    await page.goto("/search?q=normalization");

    await expect(page.getByRole("heading", { name: "Search the shelves" })).toBeVisible();
    await expect(page.locator('section[aria-labelledby="results-heading"]')).toBeVisible();
    await expect(page.getByText(/Normalization for Relational Databases/).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Fundamentals of Database Systems" }).first(),
    ).toBeVisible();
  });
});
