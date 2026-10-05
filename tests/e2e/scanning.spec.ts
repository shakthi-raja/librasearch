import { expect, test } from "@playwright/test";
import { storageFor } from "./roles";

// LS26000005 is a regular copy of Database System Concepts in the seed.
const COPY = "LS26000005";

test.describe("copy labels", () => {
  test("a scanned label opens the copy's page for anyone", async ({ page }) => {
    await page.goto(`/c/${COPY}`);
    await expect(page.getByText(`Copy ${COPY}`)).toBeVisible();
    await expect(page.getByRole("link", { name: "Database System Concepts" })).toBeVisible();
    await expect(page.getByText("Belongs on")).toBeVisible();
  });

  test("an unknown barcode is not found", async ({ page }) => {
    const response = await page.goto("/c/LS00000000");
    expect(response?.status()).toBe(404);
  });

  test("the app can be installed", async ({ request }) => {
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest).toMatchObject({ name: "LibraSearch", display: "standalone" });
  });
});

test.describe("library card", () => {
  test.use({ storageState: storageFor("student") });

  test("shows a signed code for the member", async ({ page }) => {
    await page.goto("/student/card");
    await expect(
      page.getByRole("img", { name: /Library card code for PES1UG24CS001/ }),
    ).toBeVisible();
    await expect(page.getByText(/stops working in \d:\d\d/)).toBeVisible();
  });
});

test.describe("librarian scanning", () => {
  test.use({ storageState: storageFor("librarian") });

  test("a label's page opens the desk with the copy filled in", async ({ page }) => {
    await page.goto(`/c/${COPY}`);
    await page.getByRole("link", { name: /at the desk/ }).click();
    await expect(page.getByLabel("Copy barcode")).toHaveValue(COPY);
  });

  test("the kiosk starts with borrow and return", async ({ page }) => {
    await page.goto("/kiosk");
    await expect(page.getByRole("heading", { name: "Self-checkout" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Return books" })).toBeVisible();
  });

  test("a stocktake records a typed barcode", async ({ page }) => {
    await page.goto("/admin/stocktake");
    await page.getByLabel("Rack").selectOption("CS-04");
    await page.getByRole("button", { name: "Start a stocktake" }).click();
    await expect(page.getByRole("heading", { name: "Stocktake of CS-04" })).toBeVisible();
    await page.getByLabel("Copy barcode").fill(COPY);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText(/On the right rack/)).toBeVisible();
  });
});
