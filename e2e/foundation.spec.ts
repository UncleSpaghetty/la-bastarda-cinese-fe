import { expect, test } from "@playwright/test";

test("foundation shell is responsive and routable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /liberati delle carte/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /crea il tavolo/i })).toBeVisible();
});
