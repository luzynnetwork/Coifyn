import { test, expect } from "@playwright/test";

test.use({ baseURL: "http://localhost:3002" });

// The proxy only checks for the presence of the session cookie, so a dummy
// value is enough to render the screen shell without a running backend.
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "coifyn_session", value: "e2e", url: "http://localhost:3002" },
  ]);
});

test("POS screen renders the register shell", async ({ page }) => {
  await page.goto("/pos");
  await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reports" })).toBeVisible();
});
