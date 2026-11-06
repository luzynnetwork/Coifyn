import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';
import { addStaff } from './support/staff.js';

describe('payments', () => {
  let ctx: TestApp;
  let owner: OwnerContext;
  let haircutId: string;
  let customerId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await truncateAll();
    owner = await registerOwner(ctx.http);

    haircutId = (
      await ctx.http
        .post('/api/v1/services')
        .set(owner.auth)
        .send({ name: 'Haircut', basePriceMinor: 2000, baseDurationMin: 30 })
        .expect(201)
    ).body.id;
    customerId = (
      await ctx.http
        .post('/api/v1/customers')
        .set(owner.auth)
        .send({ name: 'Ali Khan', phone: '+923001234567' })
        .expect(201)
    ).body.id;
  });

  /** An open ticket with one haircut (2000) and no tax, for the given customer. */
  const ticketWithHaircut = async (withCustomer = true) => {
    const ticket = await ctx.http
      .post('/api/v1/tickets')
      .set(owner.auth)
      .send({
        branchId: owner.branchId,
        source: 'walk_in',
        ...(withCustomer && { customerId }),
      })
      .expect(201);
    await ctx.http
      .post(`/api/v1/tickets/${ticket.body.id}/lines`)
      .set(owner.auth)
      .send({ kind: 'service', refId: haircutId })
      .expect(201);
    return ticket.body.id as string;
  };

  const pay = (
    ticketId: string,
    method: 'cash' | 'card',
    amountMinor: number,
    auth = owner.auth,
  ) =>
    ctx.http
      .post('/api/v1/payments')
      .set(auth)
      .send({ ticketId, method, amountMinor });

  it('settles a ticket with cash and updates the customer in the same step', async () => {
    const ticketId = await ticketWithHaircut();
    const res = await pay(ticketId, 'cash', 2000).expect(201);
    expect(res.body.settled).toBe(true);
    expect(res.body.ticket.status).toBe('paid');
    expect(res.body.payment.status).toBe('completed');

    const customer = await ctx.http
      .get(`/api/v1/customers/${customerId}`)
      .set(owner.auth)
      .expect(200);
    expect(customer.body.visitCount).toBe(1);
    expect(customer.body.totalSpendMinor).toBe(2000);
    expect(customer.body.lastVisitAt).toBeTruthy();

    // a paid ticket takes no more money
    await pay(ticketId, 'cash', 100).expect(409);
  });

  it('keeps a ticket open across partial payments and settles once covered', async () => {
    const ticketId = await ticketWithHaircut();

    const first = await pay(ticketId, 'cash', 500).expect(201);
    expect(first.body.settled).toBe(false);
    expect(first.body.ticket.status).toBe('open');

    await pay(ticketId, 'cash', 1600).expect(400); // more than the 1500 still due

    const card = await pay(ticketId, 'card', 1500).expect(201);
    expect(card.body.settled).toBe(true);
    expect(card.body.payment.providerRef).toBeTruthy();

    const customer = await ctx.http
      .get(`/api/v1/customers/${customerId}`)
      .set(owner.auth);
    expect(customer.body.visitCount).toBe(1); // counted once, not per payment
    expect(customer.body.totalSpendMinor).toBe(2000);
  });

  it('never lets two simultaneous full payments both succeed', async () => {
    const ticketId = await ticketWithHaircut();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => pay(ticketId, 'cash', 2000)),
    );
    const ok = results.filter((r) => r.status === 201);
    expect(ok).toHaveLength(1);

    const list = await ctx.http
      .get(`/api/v1/payments?ticketId=${ticketId}`)
      .set(owner.auth)
      .expect(200);
    const taken = list.body
      .filter((p: { status: string }) => p.status === 'completed')
      .reduce((s: number, p: { amountMinor: number }) => s + p.amountMinor, 0);
    expect(taken).toBe(2000);

    const customer = await ctx.http
      .get(`/api/v1/customers/${customerId}`)
      .set(owner.auth);
    expect(customer.body.visitCount).toBe(1);
  });

  it('issues numbered receipts once per paid ticket', async () => {
    const a = await ticketWithHaircut(false);
    const b = await ticketWithHaircut(false);

    await ctx.http.get(`/api/v1/tickets/${a}/receipt`).set(owner.auth).expect(409);

    await pay(a, 'cash', 2000).expect(201);
    await pay(b, 'cash', 2000).expect(201);

    const rb = await ctx.http.get(`/api/v1/tickets/${b}/receipt`).set(owner.auth).expect(200);
    const ra = await ctx.http.get(`/api/v1/tickets/${a}/receipt`).set(owner.auth).expect(200);
    expect(rb.body.receipt.number).toBe('R-000001'); // numbered when first issued
    expect(ra.body.receipt.number).toBe('R-000002');
    expect(ra.body.ticket.totalMinor).toBe(2000);
    expect(ra.body.lines).toHaveLength(1);

    const again = await ctx.http.get(`/api/v1/tickets/${a}/receipt`).set(owner.auth);
    expect(again.body.receipt.number).toBe('R-000002');
  });

  it('blocks Front Desk refunds until a custom role grants payment:refund', async () => {
    const ticketId = await ticketWithHaircut(false);
    const paid = await pay(ticketId, 'cash', 2000).expect(201);
    const paymentId = paid.body.payment.id;

    const desk = await addStaff(ctx, owner, 'Front Desk');
    await ctx.http
      .post(`/api/v1/payments/${paymentId}/refund`)
      .set(desk.auth)
      .send({ amountMinor: 500, reason: 'customer unhappy' })
      .expect(403);

    const role = await ctx.http
      .post('/api/v1/roles')
      .set(owner.auth)
      .send({
        name: 'Cashier',
        grants: [
          { permissionKey: 'payment:take', scope: 'branch' },
          { permissionKey: 'payment:refund', scope: 'branch' },
        ],
      })
      .expect(201);
    await ctx.http
      .post(`/api/v1/members/${desk.userId}/role`)
      .set(owner.auth)
      .send({ roleId: role.body.id })
      .expect(204);

    const refund = await ctx.http
      .post(`/api/v1/payments/${paymentId}/refund`)
      .set(desk.auth)
      .send({ amountMinor: 500, reason: 'customer unhappy' })
      .expect(201);
    expect(refund.body.amountMinor).toBe(500);
  });

  it('requires a reason, caps refunds at what was taken, and audits them', async () => {
    const ticketId = await ticketWithHaircut(false);
    const paid = await pay(ticketId, 'cash', 2000).expect(201);
    const paymentId = paid.body.payment.id;

    await ctx.http
      .post(`/api/v1/payments/${paymentId}/refund`)
      .set(owner.auth)
      .send({ amountMinor: 500 })
      .expect(400);

    await ctx.http
      .post(`/api/v1/payments/${paymentId}/refund`)
      .set(owner.auth)
      .send({ amountMinor: 1500, reason: 'partial refund' })
      .expect(201);
    await ctx.http
      .post(`/api/v1/payments/${paymentId}/refund`)
      .set(owner.auth)
      .send({ amountMinor: 600, reason: 'too much' })
      .expect(400); // only 500 left

    const detail = await ctx.http
      .get(`/api/v1/payments/${paymentId}`)
      .set(owner.auth)
      .expect(200);
    expect(detail.body.refundedMinor).toBe(1500);

    const audit = await ctx.http
      .get(`/api/v1/audit?targetId=${paymentId}`)
      .set(owner.auth)
      .expect(200);
    const rows = (Array.isArray(audit.body) ? audit.body : audit.body.items) as {
      action: string;
      reason: string | null;
    }[];
    expect(
      rows.find((r) => r.action === 'payment.refunded')?.reason,
    ).toBe('partial refund');
  });

  it('never shows or touches another salon’s payments', async () => {
    const ticketId = await ticketWithHaircut(false);
    const paid = await pay(ticketId, 'cash', 2000).expect(201);

    const other = await registerOwner(ctx.http, { salonName: 'Other Salon' });
    await pay(ticketId, 'cash', 100, other.auth).expect(404);
    await ctx.http
      .get(`/api/v1/payments/${paid.body.payment.id}`)
      .set(other.auth)
      .expect(404);
    await ctx.http
      .post(`/api/v1/payments/${paid.body.payment.id}/refund`)
      .set(other.auth)
      .send({ amountMinor: 100, reason: 'nope nope' })
      .expect(404);
    await ctx.http.get(`/api/v1/tickets/${ticketId}/receipt`).set(other.auth).expect(404);
  });
});
