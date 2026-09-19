import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';
import { addStaff } from './support/staff.js';

describe('tickets — POS', () => {
  let ctx: TestApp;
  let owner: OwnerContext;
  let stylistId: string;
  let haircutId: string;
  let beardId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await truncateAll();
    owner = await registerOwner(ctx.http);

    stylistId = (
      await ctx.http
        .post('/api/v1/stylists')
        .set(owner.auth)
        .send({ userId: owner.userId, branchId: owner.branchId, displayName: 'Ali' })
        .expect(201)
    ).body.id;

    haircutId = (
      await ctx.http
        .post('/api/v1/services')
        .set(owner.auth)
        .send({ name: 'Haircut', basePriceMinor: 2000, baseDurationMin: 30 })
        .expect(201)
    ).body.id;
    beardId = (
      await ctx.http
        .post('/api/v1/services')
        .set(owner.auth)
        .send({ name: 'Beard trim', basePriceMinor: 1000, baseDurationMin: 15 })
        .expect(201)
    ).body.id;
  });

  const setTax = (inclusive: boolean) =>
    ctx.http
      .post('/api/v1/tax-rates')
      .set(owner.auth)
      .send({ name: 'Sales', percentBasisPoints: 800, inclusive, isDefault: true })
      .expect(201);

  const openTicket = (auth = owner.auth) =>
    ctx.http
      .post('/api/v1/tickets')
      .set(auth)
      .send({ branchId: owner.branchId, source: 'walk_in' });

  const addLine = (ticketId: string, body: Record<string, unknown>, auth = owner.auth) =>
    ctx.http.post(`/api/v1/tickets/${ticketId}/lines`).set(auth).send(body);

  it('opens and closes a register, allowing only one open per branch', async () => {
    expect(
      (await ctx.http
        .get(`/api/v1/register-sessions/current?branchId=${owner.branchId}`)
        .set(owner.auth)
        .expect(200)).body,
    ).toEqual({});

    const session = await ctx.http
      .post('/api/v1/register-sessions')
      .set(owner.auth)
      .send({ branchId: owner.branchId, openingFloatMinor: 5000 })
      .expect(201);

    await ctx.http
      .post('/api/v1/register-sessions')
      .set(owner.auth)
      .send({ branchId: owner.branchId, openingFloatMinor: 100 })
      .expect(409);

    const closed = await ctx.http
      .post(`/api/v1/register-sessions/${session.body.id}/close`)
      .set(owner.auth)
      .send({ closingCountMinor: 7500 })
      .expect(201);
    expect(closed.body.closedAt).toBeTruthy();

    // once closed, a new one may open
    await ctx.http
      .post('/api/v1/register-sessions')
      .set(owner.auth)
      .send({ branchId: owner.branchId, openingFloatMinor: 0 })
      .expect(201);
  });

  it('builds a ticket from services and adds exclusive tax on top', async () => {
    await setTax(false);
    const ticket = await openTicket().expect(201);
    await addLine(ticket.body.id, { kind: 'service', refId: haircutId }).expect(201);
    const after = await addLine(ticket.body.id, {
      kind: 'service',
      refId: beardId,
    }).expect(201);

    // 2000 + 1000 = 3000, tax 8% = 240, total 3240
    expect(after.body.ticket).toMatchObject({
      subtotalMinor: 3000,
      taxMinor: 240,
      totalMinor: 3240,
    });
  });

  it('backs tax out of the price when the rate is inclusive', async () => {
    await setTax(true);
    const ticket = await openTicket().expect(201);
    const res = await addLine(ticket.body.id, {
      kind: 'service',
      refId: haircutId,
    }).expect(201);
    // 2000 gross at 8% inclusive: net 1852, tax 148, total stays 2000
    expect(res.body.ticket).toMatchObject({
      subtotalMinor: 2000,
      taxMinor: 148,
      totalMinor: 2000,
    });
  });

  it('uses the stylist’s own price for a service when they have one', async () => {
    await ctx.http
      .put(`/api/v1/stylists/${stylistId}/services`)
      .set(owner.auth)
      .send({
        entries: [
          {
            serviceId: haircutId,
            priceOverrideMinor: 3500,
            durationOverrideMin: null,
            canPerform: true,
          },
        ],
      })
      .expect(200);

    const ticket = await openTicket().expect(201);
    const withStylist = await addLine(ticket.body.id, {
      kind: 'service',
      refId: haircutId,
      stylistId,
    }).expect(201);
    expect(withStylist.body.line.unitPriceMinor).toBe(3500);

    const menu = await addLine(ticket.body.id, {
      kind: 'service',
      refId: haircutId,
    }).expect(201);
    expect(menu.body.line.unitPriceMinor).toBe(2000);
  });

  it('changes quantity and removes a line, recomputing totals each time', async () => {
    const ticket = await openTicket().expect(201);
    const added = await addLine(ticket.body.id, {
      kind: 'service',
      refId: haircutId,
    }).expect(201);
    const lineId = added.body.line.id;

    const doubled = await ctx.http
      .patch(`/api/v1/tickets/${ticket.body.id}/lines/${lineId}`)
      .set(owner.auth)
      .send({ qty: 2 })
      .expect(200);
    expect(doubled.body.ticket.subtotalMinor).toBe(4000);

    const removed = await ctx.http
      .delete(`/api/v1/tickets/${ticket.body.id}/lines/${lineId}`)
      .set(owner.auth)
      .expect(200);
    expect(removed.body.subtotalMinor).toBe(0);
  });

  it('applies a discount before tax, and requires a reason', async () => {
    await setTax(false);
    const ticket = await openTicket().expect(201);
    await addLine(ticket.body.id, { kind: 'service', refId: haircutId }).expect(201);

    await ctx.http
      .post(`/api/v1/tickets/${ticket.body.id}/discount`)
      .set(owner.auth)
      .send({ type: 'percent', value: 1000 })
      .expect(400);

    const res = await ctx.http
      .post(`/api/v1/tickets/${ticket.body.id}/discount`)
      .set(owner.auth)
      .send({ type: 'percent', value: 1000, reason: 'Loyal customer' })
      .expect(201);
    // 2000 - 200 = 1800, tax 144, total 1944
    expect(res.body.ticket).toMatchObject({
      discountMinor: 200,
      taxMinor: 144,
      totalMinor: 1944,
    });
  });

  it('blocks a Front Desk user from discounts and voids, and audits them for the owner', async () => {
    const desk = await addStaff(ctx, owner, 'Front Desk');
    const ticket = await openTicket(desk.auth).expect(201);
    await addLine(ticket.body.id, { kind: 'service', refId: haircutId }, desk.auth).expect(201);

    await ctx.http
      .post(`/api/v1/tickets/${ticket.body.id}/discount`)
      .set(desk.auth)
      .send({ type: 'amount', value: 100, reason: 'friend' })
      .expect(403);
    await ctx.http
      .post(`/api/v1/tickets/${ticket.body.id}/void`)
      .set(desk.auth)
      .send({ reason: 'mistake' })
      .expect(403);

    // a Manager may
    const manager = await addStaff(ctx, owner, 'Manager');
    await ctx.http
      .post(`/api/v1/tickets/${ticket.body.id}/discount`)
      .set(manager.auth)
      .send({ type: 'amount', value: 100, reason: 'service recovery' })
      .expect(201);
    await ctx.http
      .post(`/api/v1/tickets/${ticket.body.id}/void`)
      .set(manager.auth)
      .send({ reason: 'customer left' })
      .expect(201);

    const audit = await ctx.http
      .get(`/api/v1/audit?targetId=${ticket.body.id}`)
      .set(owner.auth)
      .expect(200);
    const rows = (Array.isArray(audit.body) ? audit.body : audit.body.items) as {
      action: string;
      reason: string | null;
      actorId: string;
    }[];
    const discount = rows.find((r) => r.action === 'ticket.discount_applied');
    const voided = rows.find((r) => r.action === 'ticket.voided');
    expect(discount?.reason).toBe('service recovery');
    expect(discount?.actorId).toBe(manager.userId);
    expect(voided?.reason).toBe('customer left');
  });

  it('freezes a voided ticket', async () => {
    const ticket = await openTicket().expect(201);
    await addLine(ticket.body.id, { kind: 'service', refId: haircutId }).expect(201);
    await ctx.http
      .post(`/api/v1/tickets/${ticket.body.id}/void`)
      .set(owner.auth)
      .send({ reason: 'entered twice' })
      .expect(201);

    await addLine(ticket.body.id, { kind: 'service', refId: beardId }).expect(409);
    await ctx.http
      .post(`/api/v1/tickets/${ticket.body.id}/void`)
      .set(owner.auth)
      .send({ reason: 'again' })
      .expect(409);
  });

  it('needs a sourceId for a queue ticket and never crosses salons', async () => {
    await ctx.http
      .post('/api/v1/tickets')
      .set(owner.auth)
      .send({ branchId: owner.branchId, source: 'queue' })
      .expect(400);

    const ticket = await openTicket().expect(201);
    const other = await registerOwner(ctx.http, { salonName: 'Other Salon' });
    await ctx.http.get(`/api/v1/tickets/${ticket.body.id}`).set(other.auth).expect(404);
    await addLine(ticket.body.id, { kind: 'service', refId: haircutId }, other.auth).expect(404);
  });
});
