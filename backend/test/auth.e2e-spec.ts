import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './support/app.js';
import { truncateAll } from './support/db.js';

describe('auth', () => {
  let ctx: TestApp;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.close());
  beforeEach(() => truncateAll());

  const creds = {
    email: 'a@example.com',
    password: 'correct horse battery staple',
    displayName: 'A',
  };

  it('register issues tokens; duplicate email is 409', async () => {
    const r = await ctx.http
      .post('/api/v1/auth/register')
      .send(creds)
      .expect(201);
    expect(r.body.tokens.accessToken).toBeTypeOf('string');

    await ctx.http.post('/api/v1/auth/register').send(creds).expect(409);
  });

  it('login rejects a wrong password with 401 and problem+json', async () => {
    await ctx.http.post('/api/v1/auth/register').send(creds).expect(201);
    const res = await ctx.http
      .post('/api/v1/auth/login')
      .send({ email: creds.email, password: 'nope' })
      .expect(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({ status: 401, title: 'Unauthorized' });
    expect(res.body.correlationId).toBeTruthy();
  });

  it('refresh rotates the token and invalidates the old one', async () => {
    const reg = await ctx.http
      .post('/api/v1/auth/register')
      .send(creds)
      .expect(201);
    const first = reg.body.tokens.refreshToken;

    const refreshed = await ctx.http
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first })
      .expect(200);
    expect(refreshed.body.refreshToken).not.toBe(first);

    // the consumed token no longer works
    await ctx.http
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first })
      .expect(401);
  });

  it('logout revokes the session so its access token stops working', async () => {
    const reg = await ctx.http
      .post('/api/v1/auth/register')
      .send(creds)
      .expect(201);
    const { accessToken, refreshToken } = reg.body.tokens;

    await ctx.http
      .get('/api/v1/auth/me')
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(200);

    await ctx.http
      .post('/api/v1/auth/logout')
      .send({ refreshToken })
      .expect(204);

    await ctx.http
      .get('/api/v1/auth/me')
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(401);
  });

  it('validation failure returns errors[] in problem+json', async () => {
    const res = await ctx.http
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'x' })
      .expect(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});
