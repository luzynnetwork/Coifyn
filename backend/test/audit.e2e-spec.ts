import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { adminSql, truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';

describe('audit', () => {
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

  it('records salon.created and role.created with the actor', async () => {
    const role = await ctx.http
      .post('/api/v1/roles')
      .set(owner.auth)
      .send({
        name: 'Apprentice',
        grants: [{ permissionKey: 'service:view', scope: 'branch' }],
      })
      .expect(201);

    const audit = await ctx.http
      .get('/api/v1/audit')
      .set(owner.auth)
      .expect(200);

    const actions = audit.body.items.map((r: { action: string }) => r.action);
    expect(actions).toContain('salon.created');
    expect(actions).toContain('role.created');

    const roleRow = audit.body.items.find(
      (r: { action: string }) => r.action === 'role.created',
    );
    expect(roleRow.actorType).toBe('staff');
    expect(roleRow.actorId).toBe(owner.userId);
    expect(roleRow.targetId).toBe(role.body.id);
  });

  it('writes a domain_event in the same breath as the change', async () => {
    await ctx.http
      .post('/api/v1/branches')
      .set(owner.auth)
      .send({ name: 'Events Test' })
      .expect(201);

    const sql = adminSql();
    try {
      const rows = await sql`select type from domain_event order by occurred_at`;
      const types = rows.map((r) => r.type);
      expect(types).toContain('SalonCreated');
      expect(types).toContain('BranchCreated');
    } finally {
      await sql.end();
    }
  });

  it('a non-privileged member cannot read the audit log', async () => {
    // register a plain user, drop them into the salon as a Stylist via SQL
    const reg = await ctx.http
      .post('/api/v1/auth/register')
      .send({
        email: `s.${Date.now()}@example.com`,
        password: 'correct horse battery staple',
        displayName: 'S',
      })
      .expect(201);
    const sql = adminSql();
    try {
      const [role] =
        await sql`select id from role where salon_id = ${owner.salonId} and name = 'Stylist'`;
      const { uuidv7 } = await import('uuidv7');
      await sql`insert into membership (id, salon_id, user_id, role_id)
        values (${uuidv7()}, ${owner.salonId}, ${reg.body.userId}, ${role.id})`;
    } finally {
      await sql.end();
    }

    await ctx.http
      .get('/api/v1/audit')
      .set({ Authorization: `Bearer ${reg.body.tokens.accessToken}` })
      .expect(403);
  });
});
