import { expect, test } from "@playwright/test";
import { storageFor } from "./roles";

test.describe("the circulation desk", () => {
  test.use({ storageState: storageFor("librarian") });

  test("issues a copy and takes it back with a slip for each step", async ({ page }) => {
    await page.goto("/admin/circulation");
    await expect(page.getByRole("heading", { name: "Circulation desk" })).toBeVisible();

    await page.getByLabel("Member: university ID or email").fill("PES1UG24CS003");
    await page.getByLabel("Copy barcode").fill("LS26000007");
    await page.getByRole("button", { name: "Issue copy" }).click();

    const loanSlip = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Loan slip" }) });
    await expect(loanSlip).toBeVisible();
    await expect(loanSlip.getByText("LS26000007")).toBeVisible();
    await expect(loanSlip.getByText(/Due/)).toBeVisible();

    await page.getByRole("button", { name: "Return" }).click();
    await page.getByLabel("Copy barcode").fill("LS26000007");
    await page.getByRole("button", { name: "Return copy" }).click();

    const returnSlip = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Return slip" }) });
    await expect(returnSlip).toBeVisible();
    await expect(returnSlip.getByText("LS26000007")).toBeVisible();
  });
});
