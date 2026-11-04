import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';

describe('queue — walk-in line', () => {
  let ctx: TestApp;
  let owner: OwnerContext;
  let stylistId: string;
  let chairId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await truncateAll();
    owner = await registerOwner(ctx.http);

    const chair = await ctx.http
      .post(`/api/v1/branches/${owner.branchId}/chairs`)
      .set(owner.auth)
      .send({ label: 'Chair 1' })
      .expect(201);
    chairId = chair.body.id;

    const stylist = await ctx.http
      .post('/api/v1/stylists')
      .set(owner.auth)
      .send({
        userId: owner.userId,
        branchId: owner.branchId,
        displayName: 'Ali',
      })
      .expect(201);
    stylistId = stylist.body.id;
  });

  const join = (name: string) =>
    ctx.http
      .post('/api/v1/queue')
      .set(owner.auth)
      .send({ branchId: owner.branchId, walkInName: name, requestedServiceIds: [] });

  it('runs a walk-in through join → assign → start → complete', async () => {
    const entry = await join('Walk-in A').expect(201);
    expect(entry.body.status).toBe('waiting');

    const assigned = await ctx.http
      .post(`/api/v1/queue/${entry.body.id}/assign`)
      .set(owner.auth)
      .send({ stylistId, chairId })
      .expect(201);
    expect(assigned.body.status).toBe('assigned');

    const started = await ctx.http
      .post(`/api/v1/queue/${entry.body.id}/start`)
      .set(owner.auth)
      .expect(201);
    expect(started.body.status).toBe('in_service');

    const done = await ctx.http
      .post(`/api/v1/queue/${entry.body.id}/complete`)
      .set(owner.auth)
      .expect(201);
    expect(done.body.status).toBe('done');

    const live = await ctx.http
      .get(`/api/v1/queue?branchId=${owner.branchId}`)
      .set(owner.auth)
      .expect(200);
    expect(live.body).toHaveLength(0);
  });

  it('numbers waiting entries by join order and estimates the wait', async () => {
    const first = await join('First').expect(201);
    const second = await join('Second').expect(201);

    const list = await ctx.http
      .get(`/api/v1/queue?branchId=${owner.branchId}`)
      .set(owner.auth)
      .expect(200);
    expect(list.body.map((e: { position: number }) => e.position)).toEqual([1, 2]);

    const est = await ctx.http
      .get(`/api/v1/queue/${second.body.id}/wait-estimate`)
      .set(owner.auth)
      .expect(200);
    expect(est.body.ahead).toBe(1);
    expect(est.body.minutes).toBe(30);

    const firstEst = await ctx.http
      .get(`/api/v1/queue/${first.body.id}/wait-estimate`)
      .set(owner.auth)
      .expect(200);
    expect(firstEst.body.ahead).toBe(0);
  });

  it('refuses an illegal transition and requires a reason to remove', async () => {
    const entry = await join('Walk-in B').expect(201);

    await ctx.http
      .post(`/api/v1/queue/${entry.body.id}/start`)
      .set(owner.auth)
      .expect(409);

    await ctx.http
      .post(`/api/v1/queue/${entry.body.id}/remove`)
      .set(owner.auth)
      .send({})
      .expect(400);

    const left = await ctx.http
      .post(`/api/v1/queue/${entry.body.id}/remove`)
      .set(owner.auth)
      .send({ reason: 'no-show' })
      .expect(201);
    expect(left.body.status).toBe('left');
    expect(left.body.leftReason).toBe('no-show');
  });

  it('needs a name or customer, and a chair from the entry’s own branch', async () => {
    await ctx.http
      .post('/api/v1/queue')
      .set(owner.auth)
      .send({ branchId: owner.branchId, requestedServiceIds: [] })
      .expect(400);

    const other = await ctx.http
      .post('/api/v1/branches')
      .set(owner.auth)
      .send({ name: 'Second Branch' })
      .expect(201);
    const otherChair = await ctx.http
      .post(`/api/v1/branches/${other.body.id}/chairs`)
      .set(owner.auth)
      .send({ label: 'X' })
      .expect(201);

    const entry = await join('Walk-in C').expect(201);
    await ctx.http
      .post(`/api/v1/queue/${entry.body.id}/assign`)
      .set(owner.auth)
      .send({ stylistId, chairId: otherChair.body.id })
      .expect(400);
  });

  it('never exposes one salon’s queue to another', async () => {
    const entry = await join('Private').expect(201);
    const other = await registerOwner(ctx.http, { salonName: 'Other Salon' });

    await ctx.http
      .post(`/api/v1/queue/${entry.body.id}/remove`)
      .set(other.auth)
      .send({ reason: 'x' })
      .expect(404);
    await ctx.http
      .get(`/api/v1/queue?branchId=${owner.branchId}`)
      .set(other.auth)
      .expect(404);
  });
});
