import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';

describe('customers', () => {
  let ctx: TestApp;
  let owner: OwnerContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await truncateAll();
    owner = await registerOwner(ctx.http);
  });

  it('creates, reads, searches and updates a customer', async () => {
    const created = await ctx.http
      .post('/api/v1/customers')
      .set(owner.auth)
      .send({ name: 'Ali Khan', phone: '+923001234567' })
      .expect(201);
    expect(created.body.visitCount).toBe(0);
    expect(created.body.totalSpendMinor).toBe(0);

    await ctx.http
      .get(`/api/v1/customers/${created.body.id}`)
      .set(owner.auth)
      .expect(200);

    const found = await ctx.http
      .get('/api/v1/customers?search=ali')
      .set(owner.auth)
      .expect(200);
    expect(found.body).toHaveLength(1);

    const updated = await ctx.http
      .patch(`/api/v1/customers/${created.body.id}`)
      .set(owner.auth)
      .send({ notes: 'prefers Ali as barber' })
      .expect(200);
    expect(updated.body.notes).toBe('prefers Ali as barber');

    const visits = await ctx.http
      .get(`/api/v1/customers/${created.body.id}/visits`)
      .set(owner.auth)
      .expect(200);
    expect(visits.body).toEqual([]);
  });

  it('rejects a duplicate phone within a salon', async () => {
    await ctx.http
      .post('/api/v1/customers')
      .set(owner.auth)
      .send({ name: 'A', phone: '+923001111111' })
      .expect(201);
    await ctx.http
      .post('/api/v1/customers')
      .set(owner.auth)
      .send({ name: 'B', phone: '+923001111111' })
      .expect(409);
  });

  it('isolates customers between salons, even with the same phone', async () => {
    const mine = await ctx.http
      .post('/api/v1/customers')
      .set(owner.auth)
      .send({ name: 'Mine', phone: '+923002222222' })
      .expect(201);

    const other = await registerOwner(ctx.http, { salonName: 'Other Salon' });
    await ctx.http
      .get(`/api/v1/customers/${mine.body.id}`)
      .set(other.auth)
      .expect(404);

    const list = await ctx.http.get('/api/v1/customers').set(other.auth).expect(200);
    expect(list.body).toHaveLength(0);

    await ctx.http
      .post('/api/v1/customers')
      .set(other.auth)
      .send({ name: 'Theirs', phone: '+923002222222' })
      .expect(201);
  });
});
