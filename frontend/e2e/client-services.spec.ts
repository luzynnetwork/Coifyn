import { test, expect } from "@playwright/test";

test.use({ baseURL: "http://localhost:3002" });

// The proxy only checks for the presence of the session cookie, so a dummy
// value is enough to render the screen shell without a running backend.
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "coifyn_session", value: "e2e", url: "http://localhost:3002" },
  ]);
});

test("services screen renders the menu shell", async ({ page }) => {
  await page.goto("/services");
  await expect(page.getByRole("heading", { name: "Service menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add service" })).toBeVisible();
  await expect(page.getByRole("link", { name: "POS" })).toBeVisible();
});
