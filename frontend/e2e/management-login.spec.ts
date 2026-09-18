import { test, expect } from "@playwright/test";

test.use({ baseURL: "http://localhost:3001" });

test("management login form is visible", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});
