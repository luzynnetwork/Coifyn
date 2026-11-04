import { uuidv7 } from 'uuidv7';
import type { TestApp } from './app.js';
import { adminSql } from './db.js';
import type { OwnerContext } from './actors.js';

/** Adds a staff user straight into the owner's salon and first branch with a
 *  named role (Manager, Front Desk, Stylist, or a custom one). Returns their
 *  user id and a bearer for them. */
export async function addStaff(
  ctx: TestApp,
  owner: OwnerContext,
  roleName: string,
): Promise<{ userId: string; auth: { Authorization: string } }> {
  const email = `staff.${uuidv7()}@example.com`;
  const reg = await ctx.http
    .post('/api/v1/auth/register')
    .send({ email, password: 'correct horse battery staple', displayName: 'S' })
    .expect(201);
  const userId = reg.body.userId as string;

  const sql = adminSql();
  try {
    const [role] = await sql`
      select id from role where salon_id = ${owner.salonId} and name = ${roleName}`;
    await sql`
      insert into membership (id, salon_id, user_id, role_id)
      values (${uuidv7()}, ${owner.salonId}, ${userId}, ${role.id})`;
    await sql`
      insert into branch_membership (id, salon_id, user_id, branch_id)
      values (${uuidv7()}, ${owner.salonId}, ${userId}, ${owner.branchId})`;
  } finally {
    await sql.end();
  }
  return {
    userId,
    auth: { Authorization: `Bearer ${reg.body.tokens.accessToken}` },
  };
}
