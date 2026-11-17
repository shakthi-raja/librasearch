import { devices, expect, type Page, test } from "@playwright/test";
import { DEMO_PASSWORD, storageFor } from "./roles";

// a narrow phone: the widest bar contents must still fit
test.use({ viewport: devices["iPhone SE"].viewport, hasTouch: true });

/** Every visible control in the top bar sits inside the screen. */
async function expectBarFits(page: Page) {
  const outside = await page.evaluate(() =>
    [...document.querySelectorAll("header a, header button")]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && (box.right > window.innerWidth + 0.5 || box.left < -0.5);
      })
      .map((element) => element.textContent?.trim()),
  );
  expect(outside).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );
}

test.describe("on a phone, signed out", () => {
  test("the sign-in button is on screen and the menu reaches every page", async ({ page }) => {
    await page.goto("/");
    await expectBarFits(page);
    await expect(page.getByRole("link", { name: "Sign in" })).toBeInViewport();

    await page.getByRole("button", { name: "Menu" }).click();
    await page
      .getByRole("navigation", { name: "Site" })
      .getByRole("link", { name: "Catalogue" })
      .click();
    await expect(page).toHaveURL(/\/catalog$/);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("Escape closes the menu", async ({ page }) => {
    await page.goto("/search");
    const toggle = page.getByRole("button", { name: "Menu" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("on a phone, as the librarian", () => {
  test.use({ storageState: storageFor("librarian") });

  test("every section is in the menu, grouped", async ({ page }) => {
    await page.goto("/admin");
    await expectBarFits(page);
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("navigation", { name: "Librarian sections" });
    await expect(menu.getByText("Planning", { exact: true })).toBeVisible();
    await menu.getByRole("link", { name: "Circulation desk" }).click();
    await expect(page.getByRole("heading", { name: "Circulation desk" })).toBeVisible();
  });
});

test.describe("on a phone, as a student", () => {
  test("signs in, opens the card from the menu and signs out from it", async ({ page }) => {
    // a session of its own, so signing out leaves the shared test sessions alone
    await page.goto("/login");
    await page.getByLabel("University ID or email").fill("PES1UG24CS001");
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/student$/);
    await expectBarFits(page);

    await page.getByRole("button", { name: "Menu" }).click();
    await page
      .getByRole("navigation", { name: "Student sections" })
      .getByRole("link", { name: "Card" })
      .click();
    await expect(page).toHaveURL(/\/student\/card$/);

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
