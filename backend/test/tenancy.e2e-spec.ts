import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';

describe('tenancy — branches & chairs', () => {
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

  it('creates, lists and updates a branch', async () => {
    const created = await ctx.http
      .post('/api/v1/branches')
      .set(owner.auth)
      .send({ name: 'Gulberg' })
      .expect(201);

    const list = await ctx.http
      .get('/api/v1/branches')
      .set(owner.auth)
      .expect(200);
    expect(list.body).toHaveLength(2); // first branch + Gulberg

    await ctx.http
      .patch(`/api/v1/branches/${created.body.id}`)
      .set(owner.auth)
      .send({ name: 'Gulberg Main' })
      .expect(200);

    const after = await ctx.http.get('/api/v1/branches').set(owner.auth);
    expect(
      after.body.find((b: { id: string }) => b.id === created.body.id).name,
    ).toBe('Gulberg Main');
  });

  it('adds a chair and blocks a duplicate label in the same branch', async () => {
    await ctx.http
      .post(`/api/v1/branches/${owner.branchId}/chairs`)
      .set(owner.auth)
      .send({ label: 'Chair 1' })
      .expect(201);

    await ctx.http
      .post(`/api/v1/branches/${owner.branchId}/chairs`)
      .set(owner.auth)
      .send({ label: 'Chair 1' })
      .expect(409);

    const chairs = await ctx.http
      .get(`/api/v1/branches/${owner.branchId}/chairs`)
      .set(owner.auth)
      .expect(200);
    expect(chairs.body).toHaveLength(1);
  });

  it('blocks deleting the last branch', async () => {
    await ctx.http
      .delete(`/api/v1/branches/${owner.branchId}`)
      .set(owner.auth)
      .expect(409);
  });

  it('blocks deleting a branch that still has chairs', async () => {
    const branch = await ctx.http
      .post('/api/v1/branches')
      .set(owner.auth)
      .send({ name: 'Second' })
      .expect(201);
    await ctx.http
      .post(`/api/v1/branches/${branch.body.id}/chairs`)
      .set(owner.auth)
      .send({ label: 'A' })
      .expect(201);

    await ctx.http
      .delete(`/api/v1/branches/${branch.body.id}`)
      .set(owner.auth)
      .expect(409);

    // retire the chair, then the delete succeeds
    const chairs = await ctx.http
      .get(`/api/v1/branches/${branch.body.id}/chairs`)
      .set(owner.auth);
    await ctx.http
      .delete(`/api/v1/chairs/${chairs.body[0].id}`)
      .set(owner.auth)
      .expect(204);
    await ctx.http
      .delete(`/api/v1/branches/${branch.body.id}`)
      .set(owner.auth)
      .expect(204);
  });
});
