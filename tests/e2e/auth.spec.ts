import { expect, test } from "@playwright/test";
import { DEMO_PASSWORD, ROLES, storageFor } from "./roles";

test.describe("signing in", () => {
  test("a librarian signs in with the form and lands on the overview", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("University ID or email").fill(ROLES.librarian.identifier);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Library overview" })).toBeVisible();
  });

  test("a wrong password keeps the person on the form with a message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("University ID or email").fill("PES1UG24CS001");
    await page.getByLabel("Password").fill("not the password");
    await page.getByRole("button", { name: "Sign in" }).click();
    // next.js renders its own route announcer with role alert, so target the form message
    await expect(page.locator("form p[role=alert]")).toContainText("incorrect");
  });

  test("a guest is sent to sign in and back", async ({ page }) => {
    await page.goto("/admin/catalog");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fcatalog/);
  });
});

test.describe("role boundaries", () => {
  test.use({ storageState: storageFor("student") });

  test("a student cannot open the librarian area", async ({ page }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).toBe(403);
    await expect(
      page.getByRole("heading", { name: "Not available to your account" }),
    ).toBeVisible();
  });

  test("a student reaches their own desk", async ({ page }) => {
    await page.goto(ROLES.student.home);
    await expect(page.getByRole("heading", { name: "Your loans" })).toBeVisible();
  });
});
