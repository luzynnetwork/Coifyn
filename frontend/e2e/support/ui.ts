import { expect, type Locator, type Page } from "@playwright/test";

/** Signs in through the real login screen and waits for the console. */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/setup");
}

/** A day-report stat card, found by its label. */
export function stat(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).locator("xpath=../..");
}

/** Picks an option from a Radix Select by its label and the option's name. */
export async function choose(page: Page, label: string, option: string | RegExp) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option }).click();
}

export async function expectMoney(locator: Locator, text: string) {
  await expect(locator).toContainText(text);
}

/** A label/amount row on the ticket or receipt (the two spans share a parent). */
export function row(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).locator("xpath=..");
}
