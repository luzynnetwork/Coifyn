import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { adminSql, truncateAll } from './support/db.js';
import { registerOwner, type OwnerContext } from './support/actors.js';
import { addStaff } from './support/staff.js';

describe('rbac', () => {
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

  it('a Stylist cannot open the roles admin; the Owner can', async () => {
    const stylist = await addStaff(ctx, owner, 'Stylist');
    await ctx.http
      .post('/api/v1/roles')
      .set(stylist.auth)
      .send({ name: 'Attempted Role', grants: [] })
      .expect(403);

    await ctx.http
      .post('/api/v1/roles')
      .set(owner.auth)
      .send({
        name: 'Senior Stylist',
        grants: [
          { permissionKey: 'service:view', scope: 'branch' },
          { permissionKey: 'appointment:manage', scope: 'branch' },
        ],
      })
      .expect(201);
  });

  it('rejects an unknown permission key and a bad branch scope', async () => {
    await ctx.http
      .post('/api/v1/roles')
      .set(owner.auth)
      .send({ name: 'Bad1', grants: [{ permissionKey: 'made:up', scope: 'org' }] })
      .expect(400);

    await ctx.http
      .post('/api/v1/roles')
      .set(owner.auth)
      .send({
        name: 'Bad2',
        grants: [{ permissionKey: 'role:create', scope: 'branch' }],
      })
      .expect(400);
  });

  it('a branch-scoped grant only works inside the member’s branch', async () => {
    // custom role: queue:manage at branch scope
    const role = await ctx.http
      .post('/api/v1/roles')
      .set(owner.auth)
      .send({
        name: 'Desk',
        grants: [
          { permissionKey: 'queue:view', scope: 'branch' },
          { permissionKey: 'branch:update', scope: 'branch' },
        ],
      })
      .expect(201);

    const desk = await addStaff(ctx, owner, 'Front Desk');
    await ctx.http
      .post(`/api/v1/members/${desk.userId}/role`)
      .set(owner.auth)
      .send({ roleId: role.body.id })
      .expect(204);

    // can update their own branch
    await ctx.http
      .patch(`/api/v1/branches/${owner.branchId}`)
      .set(desk.auth)
      .send({ name: 'Renamed by desk' })
      .expect(200);

    // a second branch they are NOT a member of
    const other = await ctx.http
      .post('/api/v1/branches')
      .set(owner.auth)
      .send({ name: 'Other' })
      .expect(201);
    await ctx.http
      .patch(`/api/v1/branches/${other.body.id}`)
      .set(desk.auth)
      .send({ name: 'nope' })
      .expect(403);
  });

  it('protects the last Owner', async () => {
    const managerRole = await adminSql();
    let roleId: string;
    try {
      const [r] =
        await managerRole`select id from role where salon_id = ${owner.salonId} and name = 'Manager'`;
      roleId = r.id;
    } finally {
      await managerRole.end();
    }
    await ctx.http
      .post(`/api/v1/members/${owner.userId}/role`)
      .set(owner.auth)
      .send({ roleId })
      .expect(403);
  });
});
