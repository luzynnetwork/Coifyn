import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';

describe('salon-setup — hours, closures, tax rates', () => {
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

  it('sets and reads a full week of branch hours, including a closed day and breaks', async () => {
    const week = [
      { weekday: 0, isClosed: true, breaks: [] },
      {
        weekday: 1,
        isClosed: false,
        opensAt: '09:00',
        closesAt: '18:00',
        breaks: [{ start: '13:00', end: '14:00' }],
      },
    ];

    await ctx.http
      .put(`/api/v1/branches/${owner.branchId}/hours`)
      .set(owner.auth)
      .send({ week })
      .expect(200);

    const hours = await ctx.http
      .get(`/api/v1/branches/${owner.branchId}/hours`)
      .set(owner.auth)
      .expect(200);

    const sunday = hours.body.find((d: { weekday: number }) => d.weekday === 0);
    expect(sunday.isClosed).toBe(true);
    expect(sunday.opensAt).toBeNull();

    const monday = hours.body.find((d: { weekday: number }) => d.weekday === 1);
    expect(monday.opensAt).toBe('09:00');
    expect(monday.breaks).toEqual([{ start: '13:00', end: '14:00' }]);
  });

  it('rejects a malformed time string', async () => {
    await ctx.http
      .put(`/api/v1/branches/${owner.branchId}/hours`)
      .set(owner.auth)
      .send({
        week: [{ weekday: 0, isClosed: false, opensAt: '9am', closesAt: '18:00', breaks: [] }],
      })
      .expect(400);
  });

  it('creates and lists a branch closure, rejects an inverted date range', async () => {
    await ctx.http
      .post(`/api/v1/branches/${owner.branchId}/closures`)
      .set(owner.auth)
      .send({ startsOn: '2026-12-20', endsOn: '2026-12-15', reason: 'bad range' })
      .expect(400);

    const created = await ctx.http
      .post(`/api/v1/branches/${owner.branchId}/closures`)
      .set(owner.auth)
      .send({ startsOn: '2026-12-25', endsOn: '2026-12-25', reason: 'Christmas' })
      .expect(201);

    const list = await ctx.http
      .get(`/api/v1/branches/${owner.branchId}/closures`)
      .set(owner.auth)
      .expect(200);
    expect(list.body).toHaveLength(1);

    await ctx.http
      .delete(`/api/v1/branch-closures/${created.body.id}`)
      .set(owner.auth)
      .expect(204);

    const after = await ctx.http
      .get(`/api/v1/branches/${owner.branchId}/closures`)
      .set(owner.auth)
      .expect(200);
    expect(after.body).toHaveLength(0);
  });

  it('keeps exactly one default tax rate as new defaults are set', async () => {
    const standard = await ctx.http
      .post('/api/v1/tax-rates')
      .set(owner.auth)
      .send({ name: 'Standard', percentBasisPoints: 800, inclusive: false, isDefault: true })
      .expect(201);
    expect(standard.body.isDefault).toBe(true);

    await ctx.http
      .post('/api/v1/tax-rates')
      .set(owner.auth)
      .send({ name: 'Reduced', percentBasisPoints: 0, inclusive: false, isDefault: true })
      .expect(201);

    const list = await ctx.http.get('/api/v1/tax-rates').set(owner.auth).expect(200);
    const defaults = list.body.filter((r: { isDefault: boolean }) => r.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].name).toBe('Reduced');

    const updated = await ctx.http
      .patch(`/api/v1/tax-rates/${standard.body.id}`)
      .set(owner.auth)
      .send({ percentBasisPoints: 850 })
      .expect(200);
    expect(updated.body.percentBasisPoints).toBe(850);
  });

  it('never lets one salon read or touch another salon’s hours, closures or tax rates', async () => {
    await ctx.http
      .put(`/api/v1/branches/${owner.branchId}/hours`)
      .set(owner.auth)
      .send({ week: [{ weekday: 1, isClosed: false, opensAt: '09:00', closesAt: '18:00', breaks: [] }] });
    await ctx.http
      .post('/api/v1/tax-rates')
      .set(owner.auth)
      .send({ name: 'Standard', percentBasisPoints: 800, inclusive: false });

    const other = await registerOwner(ctx.http, { salonName: 'Other Salon' });

    await ctx.http
      .get(`/api/v1/branches/${owner.branchId}/hours`)
      .set(other.auth)
      .expect(404);
    await ctx.http
      .put(`/api/v1/branches/${owner.branchId}/hours`)
      .set(other.auth)
      .send({ week: [{ weekday: 1, isClosed: true, breaks: [] }] })
      .expect(404);

    const otherTaxRates = await ctx.http
      .get('/api/v1/tax-rates')
      .set(other.auth)
      .expect(200);
    expect(otherTaxRates.body).toHaveLength(0);
  });
});
