import { JwtService } from '@nestjs/jwt';
import type { AppConfigService } from '../../config/config.service.js';
import { TokenService } from './tokens.js';

function makeService(overrides: Record<string, string> = {}) {
  const env: Record<string, string> = {
    JWT_ACCESS_SECRET: 'a'.repeat(40),
    JWT_REFRESH_SECRET: 'b'.repeat(40),
    JWT_ACCESS_TTL: '15m',
    JWT_REFRESH_TTL: '30d',
    ...overrides,
  };
  const config = {
    get: (k: string) => env[k],
  } as unknown as AppConfigService;
  return new TokenService(new JwtService({}), config);
}

describe('TokenService', () => {
  it('signs and verifies an access token round-trip', async () => {
    const svc = makeService();
    const token = await svc.signAccess({
      sub: 'u1',
      sid: 's1',
      email: 'a@b.co',
    });
    const claims = await svc.verifyAccess(token);
    expect(claims.sub).toBe('u1');
    expect(claims.sid).toBe('s1');
  });

  it('rejects an access token signed with a different secret', async () => {
    const a = makeService({ JWT_ACCESS_SECRET: 'x'.repeat(40) });
    const b = makeService({ JWT_ACCESS_SECRET: 'y'.repeat(40) });
    const token = await a.signAccess({ sub: 'u', sid: 's', email: 'e' });
    await expect(b.verifyAccess(token)).rejects.toBeDefined();
  });

  it('refresh tokens are unique and their hash is stable', () => {
    const svc = makeService();
    const one = svc.newRefreshToken();
    const two = svc.newRefreshToken();
    expect(one.token).not.toEqual(two.token);
    expect(svc.hashRefreshToken(one.token)).toEqual(one.hash);
  });

  it('parses the refresh TTL into a future expiry', () => {
    const svc = makeService({ JWT_REFRESH_TTL: '2d' });
    const { expiresAt } = svc.newRefreshToken();
    const days = (expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(1.9);
    expect(days).toBeLessThan(2.1);
  });
});
