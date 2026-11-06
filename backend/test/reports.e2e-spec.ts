import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { adminSql, truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';
import { addStaff } from './support/staff.js';

describe('reports', () => {
  let ctx: TestApp;
  let owner: OwnerContext;
  let stylistId: string;
  let haircutId: string;
  let beardId: string;
  let date: string;

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
    await ctx.http
      .post('/api/v1/tax-rates')
      .set(owner.auth)
      .send({ name: 'Sales', percentBasisPoints: 800, inclusive: false, isDefault: true })
      .expect(201);
  });

  const ticket = async (services: string[]) => {
    const t = await ctx.http
      .post('/api/v1/tickets')
      .set(owner.auth)
      .send({ branchId: owner.branchId, source: 'walk_in' })
      .expect(201);
    for (const refId of services) {
      await ctx.http
        .post(`/api/v1/tickets/${t.body.id}/lines`)
        .set(owner.auth)
        .send({ kind: 'service', refId, stylistId })
        .expect(201);
    }
    return t.body.id as string;
  };

  const pay = (ticketId: string, method: 'cash' | 'card', amountMinor: number) =>
    ctx.http
      .post('/api/v1/payments')
      .set(owner.auth)
      .send({ ticketId, method, amountMinor })
      .expect(201);

  /** A mixed day: two paid tickets (one discounted), one voided, one refunded. */
  const seedDay = async () => {
    const session = await ctx.http
      .post('/api/v1/register-sessions')
      .set(owner.auth)
      .send({ branchId: owner.branchId, openingFloatMinor: 5000 })
      .expect(201);

    // T1: haircut 2000 + 8% = 2160, cash
    const t1 = await ticket([haircutId]);
    const p1 = await pay(t1, 'cash', 2160);
    date = String(p1.body.ticket.paidAt).slice(0, 10);

    // T2: haircut + beard 3000, 10% off = 2700, + 8% = 2916, card
    const t2 = await ticket([haircutId, beardId]);
    await ctx.http
      .post(`/api/v1/tickets/${t2}/discount`)
      .set(owner.auth)
      .send({ type: 'percent', value: 1000, reason: 'Regular customer' })
      .expect(201);
    await pay(t2, 'card', 2916);

    // T3: voided, never paid
    const t3 = await ticket([haircutId]);
    await ctx.http
      .post(`/api/v1/tickets/${t3}/void`)
      .set(owner.auth)
      .send({ reason: 'entered by mistake' })
      .expect(201);

    // T4: paid in cash, then 500 refunded in cash
    const t4 = await ticket([beardId]);
    const p4 = await pay(t4, 'cash', 1080);
    await ctx.http
      .post(`/api/v1/payments/${p4.body.payment.id}/refund`)
      .set(owner.auth)
      .send({ amountMinor: 500, reason: 'unhappy with trim' })
      .expect(201);

    return { sessionId: session.body.id as string };
  };

  it('day report equals totals summed independently from the source rows', async () => {
    await seedDay();

    const report = await ctx.http
      .get(`/api/v1/reports/day?branchId=${owner.branchId}&date=${date}`)
      .set(owner.auth)
      .expect(200);

    // independent truth, straight from the database
    const sql = adminSql();
    let truth: Record<string, number>;
    try {
      const [t] = await sql`
        select count(*)::int as n,
               coalesce(sum(subtotal_minor),0)::int as gross,
               coalesce(sum(discount_minor),0)::int as discounts,
               coalesce(sum(tax_minor),0)::int as tax,
               coalesce(sum(total_minor),0)::int as total
        from ticket where salon_id = ${owner.salonId} and status = 'paid'`;
      const [v] = await sql`
        select count(*)::int as n from ticket
        where salon_id = ${owner.salonId} and status = 'voided'`;
      const [r] = await sql`
        select count(*)::int as n, coalesce(sum(amount_minor),0)::int as amt
        from refund where salon_id = ${owner.salonId}`;
      const [c] = await sql`
        select coalesce(sum(amount_minor),0)::int as amt from payment
        where salon_id = ${owner.salonId} and status='completed' and method='cash'`;
      truth = {
        n: t.n, gross: t.gross, discounts: t.discounts, tax: t.tax, total: t.total,
        voids: v.n, refundCount: r.n, refunds: r.amt, cash: c.amt,
      };
    } finally {
      await sql.end();
    }

    expect(report.body.ticketCount).toBe(truth.n);
    expect(report.body.grossMinor).toBe(truth.gross);
    expect(report.body.discountsMinor).toBe(truth.discounts);
    expect(report.body.taxMinor).toBe(truth.tax);
    expect(report.body.totalMinor).toBe(truth.total);
    expect(report.body.voids.count).toBe(truth.voids);
    expect(report.body.refunds).toEqual({ count: truth.refundCount, amountMinor: truth.refunds });
    expect(report.body.paymentsByMethod.cash).toBe(truth.cash);

    // and the figures we can reason about by hand
    expect(report.body.ticketCount).toBe(3);
    expect(report.body.grossMinor).toBe(2000 + 3000 + 1000);
    expect(report.body.discountsMinor).toBe(300);
    expect(report.body.totalMinor).toBe(2160 + 2916 + 1080);
    expect(report.body.netMinor + report.body.taxMinor).toBe(report.body.totalMinor);
    expect(report.body.walkIns).toBe(3);
    expect(report.body.averageTicketMinor).toBe(Math.round((2160 + 2916 + 1080) / 3));
  });

  it('a different day is empty', async () => {
    await seedDay();
    const other = await ctx.http
      .get(`/api/v1/reports/day?branchId=${owner.branchId}&date=2001-01-01`)
      .set(owner.auth)
      .expect(200);
    expect(other.body).toMatchObject({ ticketCount: 0, totalMinor: 0, refunds: { count: 0 } });
  });

  it('sales by service and by stylist add up to the paid ticket lines', async () => {
    await seedDay();
    const range = `from=${date}&to=${date}`;

    const byService = await ctx.http
      .get(`/api/v1/reports/sales/by-service?${range}`)
      .set(owner.auth)
      .expect(200);
    const haircut = byService.body.find((r: { name: string }) => r.name === 'Haircut');
    const beard = byService.body.find((r: { name: string }) => r.name === 'Beard trim');
    // paid tickets: T1 haircut, T2 haircut+beard, T4 beard  (voided T3 excluded)
    expect(haircut).toMatchObject({ quantity: 2, revenueMinor: 4000 });
    expect(beard).toMatchObject({ quantity: 2, revenueMinor: 2000 });

    const byStylist = await ctx.http
      .get(`/api/v1/reports/sales/by-stylist?${range}&branchId=${owner.branchId}`)
      .set(owner.auth)
      .expect(200);
    expect(byStylist.body).toHaveLength(1);
    expect(byStylist.body[0]).toMatchObject({
      displayName: 'Ali',
      revenueMinor: 6000,
      ticketCount: 3,
      serviceCount: 4,
    });
  });

  it('reconciles the till: expected cash from float + cash taken - cash refunded', async () => {
    const { sessionId } = await seedDay();

    const open = await ctx.http
      .get(`/api/v1/reports/register-session/${sessionId}`)
      .set(owner.auth)
      .expect(200);
    // 5000 float + 2160 + 1080 cash taken - 500 refunded (card sale is not cash)
    expect(open.body).toMatchObject({
      openingFloatMinor: 5000,
      cashTakenMinor: 3240,
      cashRefundedMinor: 500,
      expectedMinor: 7740,
      countedMinor: null,
      varianceMinor: null,
    });

    await ctx.http
      .post(`/api/v1/register-sessions/${sessionId}/close`)
      .set(owner.auth)
      .send({ closingCountMinor: 7640 })
      .expect(201);

    const closed = await ctx.http
      .get(`/api/v1/reports/register-session/${sessionId}`)
      .set(owner.auth)
      .expect(200);
    expect(closed.body.countedMinor).toBe(7640);
    expect(closed.body.varianceMinor).toBe(-100);
  });

  it('is limited to report:view and to the caller’s own salon', async () => {
    await seedDay();

    const stylist = await addStaff(ctx, owner, 'Stylist');
    await ctx.http
      .get(`/api/v1/reports/day?branchId=${owner.branchId}&date=${date}`)
      .set(stylist.auth)
      .expect(403);

    const manager = await addStaff(ctx, owner, 'Manager');
    await ctx.http
      .get(`/api/v1/reports/day?branchId=${owner.branchId}&date=${date}`)
      .set(manager.auth)
      .expect(200);

    const other = await registerOwner(ctx.http, { salonName: 'Other Salon' });
    await ctx.http
      .get(`/api/v1/reports/day?branchId=${owner.branchId}&date=${date}`)
      .set(other.auth)
      .expect(404);
    const theirs = await ctx.http
      .get(`/api/v1/reports/sales/by-service?from=${date}&to=${date}`)
      .set(other.auth)
      .expect(200);
    expect(theirs.body).toEqual([]);

    await ctx.http
      .get(`/api/v1/reports/day?branchId=${owner.branchId}&date=not-a-date`)
      .set(owner.auth)
      .expect(400);
  });
});
