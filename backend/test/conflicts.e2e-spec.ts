import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';

/**
 * "Does it exist yet?" checks followed by an insert can lose a race to a
 * concurrent request. The unique index stops the duplicate; these tests pin
 * that the caller gets a clean 409 and never a 500.
 */
describe('concurrent duplicates', () => {
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

  it('answers simultaneous sign-ups with one account and 409s, never a 500', async () => {
    const email = `race.${Date.now()}@example.com`;
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        ctx.http.post('/api/v1/auth/register').send({
          email,
          password: 'correct horse battery staple',
          displayName: 'Racer',
        }),
      ),
    );
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(5);
    expect(statuses.some((s) => s >= 500)).toBe(false);
  });

  it('answers simultaneous duplicate customers with one record and 409s', async () => {
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        ctx.http
          .post('/api/v1/customers')
          .set(owner.auth)
          .send({ name: 'Ali', phone: '+923009999999' }),
      ),
    );
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(5);
    expect(statuses.some((s) => s >= 500)).toBe(false);
  });
});
