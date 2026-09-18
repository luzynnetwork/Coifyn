import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';
import { registerOwner } from './support/actors.js';

describe('onboarding', () => {
  let ctx: TestApp;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.close());
  beforeEach(() => truncateAll());

  it('register → onboard salon → Owner of a salon with a first branch', async () => {
    const owner = await registerOwner(ctx.http, { salonName: 'Fade Room' });

    const salon = await ctx.http
      .get('/api/v1/salon')
      .set(owner.auth)
      .expect(200);
    expect(salon.body).toMatchObject({
      id: owner.salonId,
      brandName: 'Fade Room',
      yourRole: 'Owner',
      currency: 'USD',
    });

    const branches = await ctx.http
      .get('/api/v1/branches')
      .set(owner.auth)
      .expect(200);
    expect(branches.body).toHaveLength(1);
    expect(branches.body[0].id).toBe(owner.branchId);
  });

  it('seeds the four standard roles', async () => {
    const owner = await registerOwner(ctx.http);
    const roles = await ctx.http
      .get('/api/v1/roles')
      .set(owner.auth)
      .expect(200);
    const names = roles.body.map((r: { name: string }) => r.name).sort();
    expect(names).toEqual(['Front Desk', 'Manager', 'Owner', 'Stylist']);
    expect(
      roles.body.every((r: { isStandard: boolean }) => r.isStandard),
    ).toBe(true);
  });

  it('exposes the permission catalog grouped by resource', async () => {
    const owner = await registerOwner(ctx.http);
    const groups = await ctx.http
      .get('/api/v1/permissions')
      .set(owner.auth)
      .expect(200);
    const resources = groups.body.map((g: { resource: string }) => g.resource);
    expect(resources).toContain('role');
    expect(resources).toContain('queue');
  });

  it('rejects a second salon for the same account', async () => {
    const owner = await registerOwner(ctx.http);
    await ctx.http
      .post('/api/v1/onboarding/salon')
      .set(owner.auth)
      .send({ salonName: 'Second Shop' })
      .expect(409);
  });

  it('requires a bearer token', async () => {
    await ctx.http.get('/api/v1/salon').expect(401);
  });
});
