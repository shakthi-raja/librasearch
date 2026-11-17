import { expect, test } from "@playwright/test";
import { storageFor } from "./roles";

test.describe("librarian overview", () => {
  test.use({ storageState: storageFor("librarian") });

  test("shows today's desk numbers and the lists behind them", async ({ page }) => {
    await page.goto("/admin");
    const figures = page.getByRole("list", { name: "Today at the desk" });
    await expect(figures.getByText("On loan now")).toBeVisible();
    await expect(figures.getByText("Overdue")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Waiting on the hold shelf" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Most overdue" })).toBeVisible();

    await page.getByRole("link", { name: "Open the circulation desk" }).click();
    await expect(page.getByRole("heading", { name: "Circulation desk" })).toBeVisible();
  });
});

test.describe("faculty overview", () => {
  test.use({ storageState: storageFor("faculty") });

  test("lists the course they coordinate and its units", async ({ page }) => {
    await page.goto("/faculty");
    const course = page.getByRole("region", { name: /UE24CS351A/ });
    await expect(course).toBeVisible();
    await course.getByRole("link", { name: /^Unit 1:/ }).click();
    await expect(page).toHaveURL(/\/faculty\/units\/\d+$/);
  });
});

test.describe("a notice about a loan", () => {
  test.use({ storageState: storageFor("student") });

  test("opens the loans page with that loan picked out", async ({ page }) => {
    await page.goto("/notices");
    const open = page.locator('a[href^="/student/loans/"]').first();
    const href = await open.getAttribute("href");
    const loanId = href?.split("/").pop();
    await open.click();
    await expect(page).toHaveURL(new RegExp(`/student\\?loan=${loanId}`));
    await expect(page.locator(`#loan-${loanId}`)).toHaveAttribute("data-picked", "true");
  });

  test("an address that is not a loan id is not found", async ({ page }) => {
    const response = await page.goto("/student/loans/abc");
    expect(response?.status()).toBe(404);
  });
});
