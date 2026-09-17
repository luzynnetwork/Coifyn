import { test, expect } from "@playwright/test";

test.use({ baseURL: "http://localhost:3004" });

test("marketNetwork landing shell loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Coifyn Discover" })).toBeVisible();
});
