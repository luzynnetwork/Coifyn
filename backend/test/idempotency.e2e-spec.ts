import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';

describe('idempotency', () => {
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

  it('replays the first response for a repeated Idempotency-Key', async () => {
    const key = 'test-key-abc-123';

    const first = await ctx.http
      .post('/api/v1/branches')
      .set(owner.auth)
      .set('Idempotency-Key', key)
      .send({ name: 'Only Once' })
      .expect(201);

    const second = await ctx.http
      .post('/api/v1/branches')
      .set(owner.auth)
      .set('Idempotency-Key', key)
      .send({ name: 'Only Once' })
      .expect(201);

    expect(second.headers['idempotency-replayed']).toBe('true');
    expect(second.body.id).toBe(first.body.id);

    // exactly one branch was created (plus the onboarding branch)
    const branches = await ctx.http
      .get('/api/v1/branches')
      .set(owner.auth)
      .expect(200);
    expect(
      branches.body.filter((b: { name: string }) => b.name === 'Only Once'),
    ).toHaveLength(1);
  });

  it('a different key creates a new resource', async () => {
    await ctx.http
      .post('/api/v1/branches')
      .set(owner.auth)
      .set('Idempotency-Key', 'k1')
      .send({ name: 'B1' })
      .expect(201);
    await ctx.http
      .post('/api/v1/branches')
      .set(owner.auth)
      .set('Idempotency-Key', 'k2')
      .send({ name: 'B2' })
      .expect(201);

    const branches = await ctx.http.get('/api/v1/branches').set(owner.auth);
    expect(branches.body).toHaveLength(3);
  });
});
