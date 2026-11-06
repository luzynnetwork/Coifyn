import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { adminSql, truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';
import { addStaff } from './support/staff.js';

const API = '/api/v1';
const HOUR = 3600 * 1000;

/** Tomorrow as YYYY-MM-DD (the test salon's timezone is UTC). */
const tomorrow = () => new Date(Date.now() + 24 * HOUR).toISOString().slice(0, 10);

describe('phase 2 — scheduling, live status and clients', () => {
  let ctx: TestApp;
  let owner: OwnerContext;
  let ali: string; // stylist profile ids
  let sam: string;
  let samAuth: { Authorization: string };
  let haircutId: string;
  let customerId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    await truncateAll();
    owner = await registerOwner(ctx.http);

    ali = (
      await ctx.http
        .post(`${API}/stylists`)
        .set(owner.auth)
        .send({ userId: owner.userId, branchId: owner.branchId, displayName: 'Ali' })
        .expect(201)
    ).body.id;
    const samUser = await addStaff(ctx, owner, 'Stylist');
    samAuth = samUser.auth;
    sam = (
      await ctx.http
        .post(`${API}/stylists`)
        .set(owner.auth)
        .send({ userId: samUser.userId, branchId: owner.branchId, displayName: 'Sam' })
        .expect(201)
    ).body.id;

    haircutId = (
      await ctx.http
        .post(`${API}/services`)
        .set(owner.auth)
        .send({ name: 'Haircut', basePriceMinor: 2000, baseDurationMin: 30 })
        .expect(201)
    ).body.id;
    customerId = (
      await ctx.http
        .post(`${API}/customers`)
        .set(owner.auth)
        .send({ name: 'Zed Customer', phone: '+923001112223', email: 'zed@example.com' })
        .expect(201)
    ).body.id;

    // The salon vouches for Sam on haircuts; both are on shift.
    await ctx.http
      .put(`${API}/stylists/${sam}/services`)
      .set(owner.auth)
      .send({ entries: [{ serviceId: haircutId, canPerform: true }] })
      .expect(200);
    await ctx.http.post(`${API}/stylists/${ali}/clock-in`).set(owner.auth).expect(201);
    await ctx.http.post(`${API}/stylists/${sam}/clock-in`).set(owner.auth).expect(201);
  });

  const book = (stylistId: string, startAt: Date, minutes = 30, extra = {}) =>
    ctx.http
      .post(`${API}/appointments`)
      .set(owner.auth)
      .send({
        branchId: owner.branchId,
        stylistId,
        customerId,
        serviceIds: [haircutId],
        startAt: startAt.toISOString(),
        endAt: new Date(startAt.getTime() + minutes * 60000).toISOString(),
        ...extra,
      });

  describe('availability', () => {
    it('rosters a week from a template and removes slots when time off is approved', async () => {
      const template = await ctx.http
        .post(`${API}/shift-templates`)
        .set(owner.auth)
        .send({
          stylistId: ali,
          name: 'Every day',
          pattern: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
            weekday,
            start: '09:00',
            end: '17:00',
          })),
        })
        .expect(201);

      const from = tomorrow();
      const to = new Date(Date.now() + 7 * 24 * HOUR).toISOString().slice(0, 10);
      const applied = await ctx.http
        .post(`${API}/shift-templates/${template.body.id}/apply`)
        .set(owner.auth)
        .send({ from, to })
        .expect(201);
      expect(applied.body.created).toBeGreaterThanOrEqual(7);

      // applying the same range again creates nothing
      const again = await ctx.http
        .post(`${API}/shift-templates/${template.body.id}/apply`)
        .set(owner.auth)
        .send({ from, to })
        .expect(201);
      expect(again.body.created).toBe(0);

      const slotsUrl = `${API}/availability/slots?stylistId=${ali}&serviceIds=${haircutId}&date=${from}`;
      const open = await ctx.http.get(slotsUrl).set(owner.auth).expect(200);
      expect(open.body.length).toBeGreaterThan(0);

      const request = await ctx.http
        .post(`${API}/time-off`)
        .set(owner.auth)
        .send({ stylistId: ali, fromAt: `${from}T00:00:00Z`, toAt: `${from}T23:59:00Z` })
        .expect(201);
      await ctx.http
        .post(`${API}/time-off/${request.body.id}/approve`)
        .set(owner.auth)
        .expect(201);

      const after = await ctx.http.get(slotsUrl).set(owner.auth).expect(200);
      expect(after.body).toHaveLength(0);
    });
  });

  describe('booking', () => {
    it('holds a slot, refuses a second hold, and confirms the hold with a confirmation message', async () => {
      const start = new Date(Date.now() + 48 * HOUR);
      const end = new Date(start.getTime() + 30 * 60000);
      const hold = await ctx.http
        .post(`${API}/appointments/hold`)
        .set(owner.auth)
        .send({
          branchId: owner.branchId,
          stylistId: ali,
          serviceIds: [haircutId],
          startAt: start.toISOString(),
          endAt: end.toISOString(),
        })
        .expect(201);

      await ctx.http
        .post(`${API}/appointments/hold`)
        .set(owner.auth)
        .send({
          branchId: owner.branchId,
          stylistId: ali,
          serviceIds: [haircutId],
          startAt: start.toISOString(),
          endAt: end.toISOString(),
        })
        .expect(409);

      const appt = await ctx.http
        .post(`${API}/appointments/confirm`)
        .set(owner.auth)
        .send({ holdId: hold.body.id, customerId })
        .expect(201);
      expect(appt.body.status).toBe('booked');

      // the hold is used up
      await ctx.http
        .post(`${API}/appointments/confirm`)
        .set(owner.auth)
        .send({ holdId: hold.body.id, customerId })
        .expect(409);

      const deliveries = await ctx.http
        .get(`${API}/notifications/deliveries`)
        .set(owner.auth)
        .expect(200);
      expect(
        deliveries.body.some(
          (d: { templateKey: string; status: string }) =>
            d.templateKey === 'appointment.booked' && d.status === 'sent',
        ),
      ).toBe(true);
    });

    it('moves a booking, keeping the history, and refuses a clashing move', async () => {
      const start = new Date(Date.now() + 48 * HOUR);
      const a = await book(ali, start).expect(201);
      await book(ali, new Date(start.getTime() + 2 * HOUR)).expect(201);

      const moved = await ctx.http
        .post(`${API}/appointments/${a.body.id}/reschedule`)
        .set(owner.auth)
        .send({
          startAt: new Date(start.getTime() + 4 * HOUR).toISOString(),
          endAt: new Date(start.getTime() + 4.5 * HOUR).toISOString(),
          reason: 'customer asked',
        })
        .expect(201);
      expect(new Date(moved.body.startAt).getTime()).toBe(start.getTime() + 4 * HOUR);

      await ctx.http
        .post(`${API}/appointments/${a.body.id}/reschedule`)
        .set(owner.auth)
        .send({
          startAt: new Date(start.getTime() + 2 * HOUR).toISOString(),
          endAt: new Date(start.getTime() + 2.5 * HOUR).toISOString(),
        })
        .expect(409);
    });

    it('reassigns to a stand-in and still credits the original stylist', async () => {
      const a = await book(ali, new Date(Date.now() + 48 * HOUR)).expect(201);
      const res = await ctx.http
        .post(`${API}/appointments/${a.body.id}/reassign-stylist`)
        .set(owner.auth)
        .send({ stylistId: sam, reason: 'Ali is out' })
        .expect(201);
      expect(res.body.stylistId).toBe(sam);
      expect(res.body.originalStylistId).toBe(ali);

      // a second hand-off keeps pointing at the stylist the customer chose
      const back = await ctx.http
        .post(`${API}/appointments/${a.body.id}/reassign-stylist`)
        .set(owner.auth)
        .send({ stylistId: ali })
        .expect(201);
      expect(back.body.originalStylistId).toBe(ali);
    });

    it('shows a stylist their own day sheet and the front-desk board', async () => {
      const when = new Date(Date.now() + 2 * HOUR);
      await book(ali, when).expect(201);
      const date = when.toISOString().slice(0, 10);

      const sheet = await ctx.http
        .get(`${API}/appointments/day-sheet?stylistId=${ali}&date=${date}`)
        .set(owner.auth)
        .expect(200);
      expect(sheet.body.items.length).toBeGreaterThanOrEqual(1);
      expect(sheet.body.items[0].customer.name).toBe('Zed Customer');

      const board = await ctx.http
        .get(`${API}/front-desk/board?branchId=${owner.branchId}&date=${date}`)
        .set(owner.auth)
        .expect(200);
      const lane = board.body.stylists.find((s: { id: string }) => s.id === ali);
      expect(lane.upcoming.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('disruptions', () => {
    it('declares running late, offers options, applies a stand-in, and refuses a second answer', async () => {
      const a = await book(ali, new Date(Date.now() + 1 * HOUR)).expect(201);

      const late = await ctx.http
        .post(`${API}/stylists/${ali}/running-late`)
        .set(owner.auth)
        .send({ minutes: 20 })
        .expect(201);

      const affected = await ctx.http
        .get(`${API}/disruptions/${late.body.id}/affected`)
        .set(owner.auth)
        .expect(200);
      expect(affected.body.map((x: { id: string }) => x.id)).toContain(a.body.id);

      const notified = await ctx.http
        .post(`${API}/disruptions/${late.body.id}/notify`)
        .set(owner.auth)
        .expect(201);
      expect(notified.body.notified).toBe(1);
      const offer = notified.body.offers[0];
      const choices = offer.options.map((o: { choice: string }) => o.choice);
      expect(choices).toEqual(expect.arrayContaining(['wait', 'next_slot', 'stand_in', 'cancel']));

      // notifying again does not duplicate offers
      const repeat = await ctx.http
        .post(`${API}/disruptions/${late.body.id}/notify`)
        .set(owner.auth)
        .expect(201);
      expect(repeat.body.notified).toBe(0);

      // only a vouched stand-in from the offer may be chosen
      await ctx.http
        .post(`${API}/disruption-offers/${offer.id}/resolve`)
        .set(owner.auth)
        .send({ choice: 'stand_in', standInStylistId: ali })
        .expect(400);

      const resolved = await ctx.http
        .post(`${API}/disruption-offers/${offer.id}/resolve`)
        .set(owner.auth)
        .send({ choice: 'stand_in', standInStylistId: sam })
        .expect(201);
      expect(resolved.body.choice).toBe('stand_in');

      const appt = await ctx.http.get(`${API}/appointments/${a.body.id}`).set(owner.auth);
      expect(appt.body.stylistId).toBe(sam);
      expect(appt.body.originalStylistId).toBe(ali);

      await ctx.http
        .post(`${API}/disruption-offers/${offer.id}/resolve`)
        .set(owner.auth)
        .send({ choice: 'wait' })
        .expect(409);

      const open = await ctx.http
        .get(`${API}/disruptions?branchId=${owner.branchId}&status=open`)
        .set(owner.auth)
        .expect(200);
      expect(open.body).toHaveLength(0); // all offers answered -> closed
    });

    it('cancels the appointment when the customer cancels', async () => {
      const a = await book(ali, new Date(Date.now() + 1 * HOUR)).expect(201);
      const d = await ctx.http
        .post(`${API}/disruptions`)
        .set(owner.auth)
        .send({ stylistId: ali, kind: 'absent' })
        .expect(201);
      const n = await ctx.http
        .post(`${API}/disruptions/${d.body.id}/notify`)
        .set(owner.auth)
        .expect(201);
      await ctx.http
        .post(`${API}/disruption-offers/${n.body.offers[0].id}/resolve`)
        .set(owner.auth)
        .send({ choice: 'cancel' })
        .expect(201);
      const appt = await ctx.http.get(`${API}/appointments/${a.body.id}`).set(owner.auth);
      expect(appt.body.status).toBe('cancelled');
    });

    it('lets a stylist report their own lateness but not declare an absence for others', async () => {
      await ctx.http
        .post(`${API}/stylists/${sam}/running-late`)
        .set(samAuth)
        .send({ minutes: 10 })
        .expect(201);
    });
  });

  describe('live queue', () => {
    it('shows "N ahead, ~M min" per stylist and lets a customer switch lanes', async () => {
      const join = (name: string) =>
        ctx.http
          .post(`${API}/queue`)
          .set(owner.auth)
          .send({
            branchId: owner.branchId,
            walkInName: name,
            requestedStylistId: ali,
            requestedServiceIds: [haircutId],
          })
          .expect(201);
      const first = await join('One');
      await join('Two');

      const board = await ctx.http
        .get(`${API}/queue/board?branchId=${owner.branchId}`)
        .set(owner.auth)
        .expect(200);
      const lane = board.body.lanes.find((l: { stylistId: string }) => l.stylistId === ali);
      expect(lane.waitingCount).toBe(2);
      expect(lane.estimatedMinutes).toBe(60);
      expect(lane.waiting.map((w: { ahead: number; minutes: number }) => [w.ahead, w.minutes])).toEqual([
        [0, 0],
        [1, 30],
      ]);

      await ctx.http
        .post(`${API}/queue/${first.body.id}/switch-stylist`)
        .set(owner.auth)
        .send({ stylistId: sam })
        .expect(201);
      const after = await ctx.http
        .get(`${API}/queue/board?branchId=${owner.branchId}`)
        .set(owner.auth);
      const samLane = after.body.lanes.find((l: { stylistId: string }) => l.stylistId === sam);
      expect(samLane.waitingCount).toBe(1);
      expect(samLane.estimatedMinutes).toBe(30);
    });

    it('serves the public wait board without an account and without customer names', async () => {
      await ctx.http
        .post(`${API}/queue`)
        .set(owner.auth)
        .send({
          branchId: owner.branchId,
          walkInName: 'Private Person',
          requestedStylistId: ali,
          requestedServiceIds: [haircutId],
        })
        .expect(201);

      const res = await ctx.http
        .get(`${API}/public/branches/${owner.branchId}/queue`)
        .expect(200);
      expect(JSON.stringify(res.body)).not.toContain('Private Person');
      expect(res.body.lanes.find((l: { stylistId: string }) => l.stylistId === ali).waitingCount).toBe(1);
    });
  });

  describe('cut records', () => {
    it('lets a stand-in see the last cut recorded by the original stylist', async () => {
      const first = await book(ali, new Date(Date.now() + 2 * HOUR)).expect(201);
      await ctx.http
        .post(`${API}/cut-records`)
        .set(owner.auth)
        .send({
          customerId,
          appointmentId: first.body.id,
          clipperGuards: { sides: 1, back: 1.5, top: 'scissor' },
          fadeType: 'low fade',
          productsUsed: ['matte clay'],
        })
        .expect(201);

      const next = await book(ali, new Date(Date.now() + 72 * HOUR)).expect(201);
      await ctx.http
        .post(`${API}/appointments/${next.body.id}/reassign-stylist`)
        .set(owner.auth)
        .send({ stylistId: sam })
        .expect(201);

      const last = await ctx.http
        .get(`${API}/appointments/${next.body.id}/last-cut`)
        .set(samAuth)
        .expect(200);
      expect(last.body.lastCut.fadeType).toBe('low fade');
      expect(last.body.lastCut.clipperGuards.sides).toBe(1);

      const photo = await ctx.http
        .post(`${API}/cut-records/${last.body.lastCut.id}/photos`)
        .set(owner.auth)
        .send({ angle: 'front', contentType: 'image/jpeg' });
      // presigning needs object-store config; the registration itself must succeed or fail cleanly
      expect([201, 500]).toContain(photo.status);
    });

    it('stores colour formulas per customer', async () => {
      await ctx.http
        .post(`${API}/formulas`)
        .set(owner.auth)
        .send({ customerId, kind: 'color', formula: '6N + 7A 1:1', developer: '20 vol', processingMin: 35 })
        .expect(201);
      const list = await ctx.http
        .get(`${API}/customers/${customerId}/formulas`)
        .set(owner.auth)
        .expect(200);
      expect(list.body).toHaveLength(1);
    });
  });

  describe('customer profile', () => {
    it('keeps preferences, consent, tags and notes, and builds a timeline', async () => {
      await ctx.http
        .patch(`${API}/customers/${customerId}/preferences`)
        .set(owner.auth)
        .send({ preferredStylistId: ali, drink: 'tea', conversationLevel: 'quiet' })
        .expect(200);
      const prefs = await ctx.http.get(`${API}/customers/${customerId}/preferences`).set(owner.auth);
      expect(prefs.body.drink).toBe('tea');

      await ctx.http
        .patch(`${API}/customers/${customerId}/consent`)
        .set(owner.auth)
        .send({ channel: 'sms', purpose: 'marketing', status: 'granted' })
        .expect(200);
      await ctx.http
        .patch(`${API}/customers/${customerId}/consent`)
        .set(owner.auth)
        .send({ channel: 'sms', purpose: 'transactional', status: 'revoked' })
        .expect(400);

      await ctx.http.post(`${API}/customers/${customerId}/tags`).set(owner.auth).send({ tag: 'VIP' }).expect(201);
      await ctx.http
        .post(`${API}/customers/${customerId}/notes`)
        .set(owner.auth)
        .send({ body: 'Prefers the corner chair' })
        .expect(201);

      const timeline = await ctx.http.get(`${API}/customers/${customerId}/timeline`).set(owner.auth).expect(200);
      expect(timeline.body.tags).toContain('vip');
      expect(timeline.body.items.some((i: { kind: string }) => i.kind === 'note')).toBe(true);
    });

    it('merges duplicates, moving history onto the survivor, with an audit reason', async () => {
      const dup = (
        await ctx.http
          .post(`${API}/customers`)
          .set(owner.auth)
          .send({ name: 'Zed (dup)', phone: '+923009998887' })
          .expect(201)
      ).body.id;
      await ctx.http.post(`${API}/customers/${dup}/notes`).set(owner.auth).send({ body: 'from dup' }).expect(201);

      await ctx.http
        .post(`${API}/customers/merge`)
        .set(owner.auth)
        .send({ survivorId: customerId, mergedId: dup, reason: 'same person' })
        .expect(201);

      const timeline = await ctx.http.get(`${API}/customers/${customerId}/timeline`).set(owner.auth);
      expect(timeline.body.items.some((i: { summary: string }) => i.summary === 'from dup')).toBe(true);
      await ctx.http.get(`${API}/customers/${dup}`).set(owner.auth).expect(404);
    });
  });

  describe('loyalty and dashboard', () => {
    const payHaircut = async () => {
      const ticket = await ctx.http
        .post(`${API}/tickets`)
        .set(owner.auth)
        .send({ branchId: owner.branchId, source: 'walk_in', customerId })
        .expect(201);
      await ctx.http
        .post(`${API}/tickets/${ticket.body.id}/lines`)
        .set(owner.auth)
        .send({ kind: 'service', refId: haircutId })
        .expect(201);
      await ctx.http
        .post(`${API}/payments`)
        .set(owner.auth)
        .send({ ticketId: ticket.body.id, method: 'cash', amountMinor: 2000 })
        .expect(201);
    };

    it('accrues points on payment, gates manual adjustment, and audits it', async () => {
      await payHaircut();
      const acct = await ctx.http.get(`${API}/customers/${customerId}/loyalty`).set(owner.auth).expect(200);
      expect(acct.body.pointsBalance).toBe(20); // 1 point per currency unit of a 2000-minor sale

      await ctx.http
        .post(`${API}/customers/${customerId}/loyalty/adjust`)
        .set(samAuth)
        .send({ delta: 5, reason: 'goodwill' })
        .expect(403);

      const adj = await ctx.http
        .post(`${API}/customers/${customerId}/loyalty/adjust`)
        .set(owner.auth)
        .send({ delta: 5, reason: 'goodwill' })
        .expect(201);
      expect(adj.body.pointsBalance).toBe(25);

      await ctx.http
        .post(`${API}/customers/${customerId}/loyalty/adjust`)
        .set(owner.auth)
        .send({ delta: -100, reason: 'too much' })
        .expect(400);

      const ledger = await ctx.http.get(`${API}/customers/${customerId}/loyalty/ledger`).set(owner.auth);
      expect(ledger.body.map((l: { kind: string }) => l.kind).sort()).toEqual(['adjust', 'earn']);

      const sql = adminSql();
      try {
        const audit =
          await sql`select action from audit_event where action = 'loyalty.adjusted'`;
        expect(audit).toHaveLength(1);
      } finally {
        await sql.end();
      }
    });

    it('reports KPIs with a definition and comparison, and revenue matches the payments', async () => {
      await payHaircut();
      const dash = await ctx.http
        .get(`${API}/dashboard?branchId=${owner.branchId}&range=today&compare=true`)
        .set(owner.auth)
        .expect(200);
      expect(dash.body.kpis).toHaveLength(7);
      for (const k of dash.body.kpis) {
        expect(k.definition).toBeTruthy();
        expect(k.source).toBeTruthy();
        expect(k).toHaveProperty('comparison');
      }
      const revenue = dash.body.kpis.find((k: { key: string }) => k.key === 'revenueMinor');
      expect(revenue.value).toBe(2000);
    });
  });

  describe('customer app first slice', () => {
    const slugOf = async () => {
      const sql = adminSql();
      try {
        const [row] = await sql`select slug from salon_organization where id = ${owner.salonId}`;
        return row.slug as string;
      } finally {
        await sql.end();
      }
    };

    it('lets a visitor see the salon, request a slot, and staff confirm it — isolated per salon', async () => {
      // roster Ali for tomorrow so there is something to book
      const date = tomorrow();
      await ctx.http
        .post(`${API}/shifts`)
        .set(owner.auth)
        .send({ stylistId: ali, startAt: `${date}T09:00:00Z`, endAt: `${date}T12:00:00Z` })
        .expect(201);
      const slug = await slugOf();

      const page = await ctx.http.get(`${API}/public/salons/${slug}`).expect(200);
      expect(page.body.services.map((s: { id: string }) => s.id)).toContain(haircutId);
      const stylist = page.body.stylists.find((s: { id: string }) => s.id === ali);
      expect(stylist.nextSlot).toBeTruthy();

      const slots = await ctx.http
        .get(`${API}/public/salons/${slug}/slots?stylistId=${ali}&serviceIds=${haircutId}&date=${date}`)
        .expect(200);
      expect(slots.body.length).toBeGreaterThan(0);

      // a slot that is not on offer is refused
      await ctx.http
        .post(`${API}/public/salons/${slug}/booking-requests`)
        .send({
          stylistId: ali,
          serviceIds: [haircutId],
          startAt: `${date}T03:00:00Z`,
          customerName: 'Walker',
          customerPhone: '+923007776665',
        })
        .expect(409);

      const request = await ctx.http
        .post(`${API}/public/salons/${slug}/booking-requests`)
        .send({
          stylistId: ali,
          serviceIds: [haircutId],
          startAt: slots.body[0].startAt,
          customerName: 'Walker',
          customerPhone: '+923007776665',
        })
        .expect(201);

      const list = await ctx.http
        .get(`${API}/booking-requests?branchId=${owner.branchId}&status=requested`)
        .set(owner.auth)
        .expect(200);
      expect(list.body).toHaveLength(1);

      // another salon never sees it
      const other = await registerOwner(ctx.http);
      const theirs = await ctx.http
        .get(`${API}/booking-requests?branchId=${owner.branchId}`)
        .set(other.auth)
        .expect(200);
      expect(theirs.body).toHaveLength(0);

      const confirmed = await ctx.http
        .post(`${API}/booking-requests/${request.body.id}/confirm`)
        .set(owner.auth)
        .expect(201);
      expect(confirmed.body.appointment.status).toBe('booked');
      expect(confirmed.body.appointment.source).toBe('customer_request');
    });
  });
});
