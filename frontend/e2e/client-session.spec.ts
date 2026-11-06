import { test, expect } from "@playwright/test";
import { createOwner } from "./support/backend";

test.use({ baseURL: "http://localhost:3002" });

test.describe("client console session", () => {
  test("signs in through the UI and keeps tokens out of page JavaScript", async ({
    page,
    context,
    request,
  }) => {
    const owner = await createOwner(request);

    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(owner.email);
    await page.getByPlaceholder("Password").fill(owner.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/setup");

    const cookies = await context.cookies();
    const access = cookies.find((c) => c.name === "coifyn_access");
    const refresh = cookies.find((c) => c.name === "coifyn_refresh");
    expect(access?.httpOnly).toBe(true);
    expect(refresh?.httpOnly).toBe(true);

    // no script on the page can read either token
    const readable = await page.evaluate(() => document.cookie);
    expect(readable).not.toContain("coifyn_access");
    expect(readable).not.toContain("coifyn_refresh");
    const stored = await page.evaluate(() =>
      JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }),
    );
    expect(stored).not.toContain("eyJ"); // no JWT anywhere in web storage
  });

  test("calls the API through the same-origin proxy with the user's identity", async ({
    page,
    request,
  }) => {
    const owner = await createOwner(request);
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(owner.email);
    await page.getByPlaceholder("Password").fill(owner.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/setup");

    const me = await page.evaluate(async () => {
      const r = await fetch("/api/v1/auth/me");
      return { status: r.status, body: await r.json() };
    });
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(owner.email);
  });

  test("rejects a wrong password without leaking why, and sets no cookies", async ({
    page,
    context,
    request,
  }) => {
    const owner = await createOwner(request);
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(owner.email);
    await page.getByPlaceholder("Password").fill("definitely the wrong password");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/could not sign in/i)).toBeVisible();
    expect(page.url()).toContain("/login");
    const names = (await context.cookies()).map((c) => c.name);
    expect(names).not.toContain("coifyn_access");
    expect(names).not.toContain("coifyn_refresh");
  });

  test("silently renews an expired access token and keeps the user signed in", async ({
    page,
    context,
    request,
  }) => {
    const owner = await createOwner(request);
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(owner.email);
    await page.getByPlaceholder("Password").fill(owner.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/setup");

    const before = (await context.cookies()).find((c) => c.name === "coifyn_access");
    await context.addCookies([
      {
        name: "coifyn_access",
        value: "expired-or-tampered",
        url: "http://localhost:3002",
        httpOnly: true,
      },
    ]);

    const me = await page.evaluate(async () => (await fetch("/api/v1/auth/me")).status);
    expect(me).toBe(200);

    const after = (await context.cookies()).find((c) => c.name === "coifyn_access");
    expect(after?.value).not.toBe("expired-or-tampered");
    expect(after?.value).not.toBe(before?.value);
  });

  test("sends an API call with no session a 401, not a login page", async ({ request }) => {
    const response = await request.get("http://localhost:3002/api/v1/auth/me", {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(401);
    expect(response.headers()["content-type"]).toContain("json");
  });

  test("signs out: the session is revoked and the gate closes", async ({
    page,
    context,
    request,
  }) => {
    const owner = await createOwner(request);
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(owner.email);
    await page.getByPlaceholder("Password").fill(owner.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/setup");

    const refreshBefore = (await context.cookies()).find(
      (c) => c.name === "coifyn_refresh",
    );

    await page.evaluate(() => fetch("/api/session", { method: "DELETE" }));
    const names = (await context.cookies()).map((c) => c.name);
    expect(names).not.toContain("coifyn_refresh");

    await page.goto("/setup");
    await page.waitForURL("**/login");

    // the old refresh token no longer works against the API
    const reuse = await request.post("http://localhost:4000/api/v1/auth/refresh", {
      data: { refreshToken: refreshBefore?.value },
    });
    expect(reuse.status()).toBe(401);
  });
});
