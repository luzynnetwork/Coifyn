import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';

describe('appointments — staff-entered bookings', () => {
  let ctx: TestApp;
  let owner: OwnerContext;
  let stylistId: string;
  let chairId: string;
  let serviceId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await truncateAll();
    owner = await registerOwner(ctx.http);

    chairId = (
      await ctx.http
        .post(`/api/v1/branches/${owner.branchId}/chairs`)
        .set(owner.auth)
        .send({ label: 'Chair 1' })
        .expect(201)
    ).body.id;

    stylistId = (
      await ctx.http
        .post('/api/v1/stylists')
        .set(owner.auth)
        .send({ userId: owner.userId, branchId: owner.branchId, displayName: 'Ali' })
        .expect(201)
    ).body.id;

    serviceId = (
      await ctx.http
        .post('/api/v1/services')
        .set(owner.auth)
        .send({ name: 'Haircut', basePriceMinor: 1500, baseDurationMin: 30 })
        .expect(201)
    ).body.id;
  });

  const book = (
    startAt: string,
    endAt: string,
    extra: Record<string, unknown> = {},
  ) =>
    ctx.http
      .post('/api/v1/appointments')
      .set(owner.auth)
      .send({
        branchId: owner.branchId,
        stylistId,
        chairId,
        serviceIds: [serviceId],
        startAt,
        endAt,
        ...extra,
      });

  it('books, lists the day in the salon timezone, and walks the status flow', async () => {
    const appt = await book('2026-09-19T10:00:00Z', '2026-09-19T10:30:00Z').expect(201);
    expect(appt.body.status).toBe('booked');

    const day = await ctx.http
      .get(`/api/v1/appointments?branchId=${owner.branchId}&date=2026-09-19`)
      .set(owner.auth)
      .expect(200);
    expect(day.body).toHaveLength(1);

    const other = await ctx.http
      .get(`/api/v1/appointments?branchId=${owner.branchId}&date=2026-09-20`)
      .set(owner.auth)
      .expect(200);
    expect(other.body).toHaveLength(0);

    const id = appt.body.id;
    await ctx.http.post(`/api/v1/appointments/${id}/start`).set(owner.auth).expect(409);
    await ctx.http.post(`/api/v1/appointments/${id}/arrive`).set(owner.auth).expect(201);
    await ctx.http.post(`/api/v1/appointments/${id}/start`).set(owner.auth).expect(201);
    const done = await ctx.http
      .post(`/api/v1/appointments/${id}/complete`)
      .set(owner.auth)
      .expect(201);
    expect(done.body.status).toBe('completed');

    await ctx.http.post(`/api/v1/appointments/${id}/cancel`).set(owner.auth).expect(409);
  });

  it('refuses an overlapping booking for the same stylist, allows back-to-back', async () => {
    await book('2026-09-19T10:00:00Z', '2026-09-19T10:30:00Z').expect(201);
    await book('2026-09-19T10:15:00Z', '2026-09-19T10:45:00Z').expect(409);
    await book('2026-09-19T10:30:00Z', '2026-09-19T11:00:00Z').expect(201);
  });

  it('refuses a chair clash even with a different stylist', async () => {
    const secondUser = await ctx.http
      .post('/api/v1/auth/register')
      .send({
        email: `sara.${Date.now()}@example.com`,
        password: 'correct horse battery staple',
        displayName: 'Sara',
      })
      .expect(201);
    const second = (
      await ctx.http
        .post('/api/v1/stylists')
        .set(owner.auth)
        .send({
          userId: secondUser.body.userId,
          branchId: owner.branchId,
          displayName: 'Sara',
        })
        .expect(201)
    ).body.id;

    await book('2026-09-19T12:00:00Z', '2026-09-19T12:30:00Z').expect(201);
    await book('2026-09-19T12:00:00Z', '2026-09-19T12:30:00Z', {
      stylistId: second,
    }).expect(409);
  });

  it('frees the slot once an appointment is cancelled', async () => {
    const first = await book('2026-09-19T14:00:00Z', '2026-09-19T14:30:00Z').expect(201);
    await ctx.http
      .post(`/api/v1/appointments/${first.body.id}/cancel`)
      .set(owner.auth)
      .expect(201);
    await book('2026-09-19T14:00:00Z', '2026-09-19T14:30:00Z').expect(201);
  });

  it('lets only one of many simultaneous bookings for the same slot succeed', async () => {
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        book('2026-09-19T16:00:00Z', '2026-09-19T16:30:00Z'),
      ),
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(5);
  });

  it('checks the overlap rule again when a booking is moved', async () => {
    await book('2026-09-19T10:00:00Z', '2026-09-19T10:30:00Z').expect(201);
    const later = await book('2026-09-19T11:00:00Z', '2026-09-19T11:30:00Z').expect(201);

    await ctx.http
      .patch(`/api/v1/appointments/${later.body.id}`)
      .set(owner.auth)
      .send({ startAt: '2026-09-19T10:10:00Z', endAt: '2026-09-19T10:40:00Z' })
      .expect(409);

    // moving within its own slot never conflicts with itself
    await ctx.http
      .patch(`/api/v1/appointments/${later.body.id}`)
      .set(owner.auth)
      .send({ startAt: '2026-09-19T11:05:00Z', endAt: '2026-09-19T11:35:00Z' })
      .expect(200);
  });

  it('allows an authorised override only with a reason, and audits it', async () => {
    await book('2026-09-19T18:00:00Z', '2026-09-19T18:30:00Z').expect(201);
    const over = await book('2026-09-19T18:10:00Z', '2026-09-19T18:40:00Z', {
      overrideReason: 'VIP walk-in',
    }).expect(201);

    const audit = await ctx.http
      .get(`/api/v1/audit?targetId=${over.body.id}`)
      .set(owner.auth)
      .expect(200);
    const rows = Array.isArray(audit.body) ? audit.body : audit.body.items;
    expect(
      rows.some((r: { action: string }) => r.action === 'appointment.booked_override'),
    ).toBe(true);
  });

  it('validates the time range and never exposes another salon’s bookings', async () => {
    await book('2026-09-19T10:30:00Z', '2026-09-19T10:00:00Z').expect(400);

    const appt = await book('2026-09-19T20:00:00Z', '2026-09-19T20:30:00Z').expect(201);
    const other = await registerOwner(ctx.http, { salonName: 'Other Salon' });
    await ctx.http.get(`/api/v1/appointments/${appt.body.id}`).set(other.auth).expect(404);
    await ctx.http
      .get(`/api/v1/appointments?branchId=${owner.branchId}&date=2026-09-19`)
      .set(other.auth)
      .expect(404);
  });
});
