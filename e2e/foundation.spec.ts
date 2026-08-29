import { expect, test } from "@playwright/test";

test("foundation shell is responsive and routable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /tavolo digitale/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /crea una stanza/i })).toBeVisible();
});
