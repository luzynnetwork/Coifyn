import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';
import { registerOwner } from './support/actors.js';

/**
 * The one test that matters most: Row-Level Security actually isolates two
 * salons. The app connects as a non-superuser role in the e2e setup, so a bug
 * in the application-layer scoping is caught here by the database refusing the
 * row rather than serving it.
 */
describe('tenant isolation', () => {
  let ctx: TestApp;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.close());
  beforeEach(() => truncateAll());

  it('one salon cannot see or touch another salon’s data', async () => {
    const a = await registerOwner(ctx.http, { salonName: 'Alpha Cuts' });
    const b = await registerOwner(ctx.http, { salonName: 'Beta Barbers' });

    const bBranch = await ctx.http
      .post('/api/v1/branches')
      .set(b.auth)
      .send({ name: 'Beta HQ' })
      .expect(201);

    // A's branch list contains only A's branches
    const aBranches = await ctx.http
      .get('/api/v1/branches')
      .set(a.auth)
      .expect(200);
    const aBranchIds = aBranches.body.map((x: { id: string }) => x.id);
    expect(aBranchIds).toContain(a.branchId);
    expect(aBranchIds).not.toContain(bBranch.body.id);

    // A cannot read B's salon
    const aSalon = await ctx.http.get('/api/v1/salon').set(a.auth).expect(200);
    expect(aSalon.body.id).toBe(a.salonId);
    expect(aSalon.body.id).not.toBe(b.salonId);

    // A cannot update B's branch (not found under A's scope)
    await ctx.http
      .patch(`/api/v1/branches/${bBranch.body.id}`)
      .set(a.auth)
      .send({ name: 'hijacked' })
      .expect(404);

    // A cannot add a chair to B's branch
    await ctx.http
      .post(`/api/v1/branches/${bBranch.body.id}/chairs`)
      .set(a.auth)
      .send({ label: 'X' })
      .expect(404);

    // A cannot see B's audit log entries
    const aAudit = await ctx.http.get('/api/v1/audit').set(a.auth).expect(200);
    for (const row of aAudit.body.items) {
      expect(row.salonId).toBe(a.salonId);
    }
  });
});
