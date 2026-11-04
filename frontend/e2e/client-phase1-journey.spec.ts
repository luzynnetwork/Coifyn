import { test, expect } from "@playwright/test";
import { API, createFrontDesk, createOwner, seedCatalog } from "./support/backend";
import { choose, row, signIn, stat } from "./support/ui";

test.use({ baseURL: "http://localhost:3002" });

/**
 * Phase 1 acceptance, driven through the real console against the real API and
 * a real (RLS-enforced) database: a walk-in is queued, assigned, charged,
 * discounted, paid and receipted, then refunded, and the owner's day report
 * shows exactly that. A second browser tab watches the board live.
 */
test("a salon day: walk-in → queue → chair → POS → discount → pay → receipt → refund → report", async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(180_000);

  const owner = await createOwner(request);
  await seedCatalog(request, owner);
  await signIn(page, owner.email, owner.password);

  // ── open the till ────────────────────────────────────────────────────────
  await test.step("open the register with a $50.00 float", async () => {
    await page.goto("/pos");
    await page.getByPlaceholder("Opening float ($)").fill("50");
    await page.getByRole("button", { name: "Open register" }).click();
    await expect(page.getByText(/Register open/)).toContainText("$50.00");
  });

  // ── a second device watches the board ────────────────────────────────────
  const board = await context.newPage();
  await board.goto("/queue");
  await expect(board.getByText("Waiting (0)")).toBeVisible();

  await test.step("a walk-in joins and appears on the other device without a reload", async () => {
    await page.goto("/queue");
    await page.getByRole("button", { name: "Add walk-in" }).click();
    await page.getByLabel("Name").fill("Walk-in Ali");
    await page.getByLabel("Haircut").check();
    await page.getByRole("button", { name: "Add to queue" }).click();

    await expect(page.getByText("Waiting (1)")).toBeVisible();
    await expect(board.getByText("Walk-in Ali")).toBeVisible({ timeout: 15_000 });
    await expect(board.getByText("Waiting (1)")).toBeVisible();
    await expect(page.getByText(/0 ahead/)).toBeVisible();
  });

  await test.step("assign a stylist and chair; the other device moves the card", async () => {
    await page.getByRole("button", { name: "Assign" }).click();
    await choose(page, "Stylist", "Ali");
    await choose(page, "Chair", "Chair 1");
    await page.getByRole("dialog").getByRole("button", { name: "Assign" }).click();

    await expect(page.getByText("Assigned (1)")).toBeVisible();
    await expect(board.getByText("Assigned (1)")).toBeVisible({ timeout: 15_000 });
    await expect(board.getByText("Waiting (0)")).toBeVisible();
  });

  await test.step("start the service", async () => {
    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByText("In service (1)")).toBeVisible();
    await expect(board.getByText("In service (1)")).toBeVisible({ timeout: 15_000 });
  });

  await test.step("charge the queue entry: a ticket with the requested service", async () => {
    await page.getByRole("button", { name: "Charge" }).click();
    await page.waitForURL("**/pos?**");
    await expect(page.getByText("Haircut")).toBeVisible();
    await expect(row(page, "Subtotal")).toContainText("$20.00");
    await expect(row(page, "Tax")).toContainText("$1.60");
    await expect(row(page, "Total")).toContainText("$21.60");
  });

  await test.step("a discount needs a real reason, then reduces the tax too", async () => {
    await page.getByRole("button", { name: "Discount" }).click();
    await page.getByLabel("Value").fill("10");
    await page.getByLabel(/Reason/).fill("no");
    await expect(page.getByRole("button", { name: "Apply" })).toBeDisabled();

    await page.getByLabel(/Reason/).fill("Regular customer");
    await page.getByRole("button", { name: "Apply" }).click();

    // 10% off 2000 = 200; tax on 1800 = 144; total 1944
    await expect(row(page, "Tax")).toContainText("$1.44");
    await expect(row(page, "Total")).toContainText("$19.44");
    await expect(page.getByText(/Regular customer/)).toBeVisible();
  });

  await test.step("take the payment in cash and get a numbered receipt", async () => {
    await page.getByRole("button", { name: /^Pay / }).click();
    await expect(page.getByLabel("Amount ($)")).toHaveValue("19.44");
    await page.getByRole("button", { name: "Charge cash" }).click();

    await expect(page.getByText(/Receipt #R-000001/)).toBeVisible();
    await expect(row(page, "Total")).toContainText("$19.44");
    await expect(page.getByText(/cash \$19\.44/i)).toBeVisible();
  });

  await test.step("refund part of it with a reason", async () => {
    await page.getByRole("button", { name: "Refund" }).first().click();
    await page.getByLabel("Amount ($)").fill("5");
    await page.getByLabel("Reason").fill("Unhappy with the fade");
    await page.getByRole("dialog").getByRole("button", { name: "Refund" }).click();
    await expect(page.getByText("Refunded $5.00")).toBeVisible();
  });

  await test.step("the owner's day report shows exactly that day", async () => {
    await page.goto("/reports");
    await expect(stat(page, "Tickets")).toContainText("1");
    await expect(stat(page, "Gross")).toContainText("$20.00");
    await expect(stat(page, "Discounts")).toContainText("$2.00");
    await expect(stat(page, "Tax")).toContainText("$1.44");
    await expect(stat(page, "Net (excl. tax)")).toContainText("$18.00");
    await expect(stat(page, "Refunds (1)")).toContainText("$5.00");
    await expect(stat(page, "Cash")).toContainText("$19.44");
    await expect(stat(page, "Walk-ins")).toContainText("1");
  });

  await test.step("the screen agrees with the database of record", async () => {
    const day = new Date().toISOString().slice(0, 10);
    const res = await request.get(
      `${API}/reports/day?branchId=${owner.branchId}&date=${day}`,
      { headers: owner.auth },
    );
    const report = await res.json();
    expect(report).toMatchObject({
      ticketCount: 1,
      grossMinor: 2000,
      discountsMinor: 200,
      taxMinor: 144,
      totalMinor: 1944,
      netMinor: 1800,
      refunds: { count: 1, amountMinor: 500 },
      paymentsByMethod: { cash: 1944, card: 0 },
    });

    // the queue entry finished its life and left the live board
    const queue = await request.get(`${API}/queue?branchId=${owner.branchId}`, {
      headers: owner.auth,
    });
    expect((await queue.json()).length).toBe(1); // still in service until completed
  });

  await test.step("completing the service clears it from every board", async () => {
    await page.goto("/queue");
    await page.getByRole("button", { name: "Complete" }).click();
    await expect(page.getByText("In service (0)")).toBeVisible();
    await expect(board.getByText("In service (0)")).toBeVisible({ timeout: 15_000 });
  });
});

test("a Front Desk user cannot discount, void or refund — the owner can", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);

  const owner = await createOwner(request);
  await seedCatalog(request, owner);
  const desk = await createFrontDesk(request, owner);

  // owner sells a haircut and takes the money, leaving a payment to refund
  const ticket = await (
    await request.post(`${API}/tickets`, {
      headers: owner.auth,
      data: { branchId: owner.branchId, source: "walk_in" },
    })
  ).json();
  const services = await (
    await request.get(`${API}/services`, { headers: owner.auth })
  ).json();
  const haircut = services.find((s: { name: string }) => s.name === "Haircut");
  await request.post(`${API}/tickets/${ticket.id}/lines`, {
    headers: owner.auth,
    data: { kind: "service", refId: haircut.id },
  });

  await signIn(page, desk.email, desk.password);
  await page.goto(`/pos?branchId=${owner.branchId}&ticketId=${ticket.id}`);
  await expect(page.getByText("Haircut")).toBeVisible();

  await page.getByRole("button", { name: "Discount" }).click();
  await page.getByLabel("Value").fill("10");
  await page.getByLabel(/Reason/).fill("Friend of the family");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(/Missing permission: pos:discount/)).toBeVisible();
  await page.keyboard.press("Escape");

  // nothing changed on the ticket
  const after = await (
    await request.get(`${API}/tickets/${ticket.id}`, { headers: owner.auth })
  ).json();
  expect(after.discountMinor).toBe(0);
  expect(after.status).toBe("open");
});
