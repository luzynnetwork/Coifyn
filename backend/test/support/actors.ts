import type { Agent } from 'supertest';

export interface OwnerContext {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  auth: { Authorization: string };
  salonId: string;
  branchId: string;
}

let seq = 0;

/** register → onboard a salon → return everything a test needs to act as the
 *  Owner. */
export async function registerOwner(
  http: Agent,
  opts: { salonName?: string; email?: string } = {},
): Promise<OwnerContext> {
  const email = opts.email ?? `owner${++seq}.${Date.now()}@example.com`;
  const password = 'correct horse battery staple';

  const reg = await http
    .post('/api/v1/auth/register')
    .send({ email, password, displayName: 'Test Owner' })
    .expect(201);

  const accessToken = reg.body.tokens.accessToken as string;
  const auth = { Authorization: `Bearer ${accessToken}` };

  const onboard = await http
    .post('/api/v1/onboarding/salon')
    .set(auth)
    .send({ salonName: opts.salonName ?? `Fade Room ${seq}` })
    .expect(201);

  return {
    userId: reg.body.userId,
    email,
    accessToken,
    refreshToken: reg.body.tokens.refreshToken,
    auth,
    salonId: onboard.body.salon.id,
    branchId: onboard.body.branch.id,
  };
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
