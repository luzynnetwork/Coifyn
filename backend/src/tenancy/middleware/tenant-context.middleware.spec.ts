import type { AppConfigService } from '../../config/config.service.js';
import { TenantContextMiddleware } from './tenant-context.middleware.js';

function run(host: string, base = 'coifyn.app') {
  const config = { get: () => base } as unknown as AppConfigService;
  const mw = new TenantContextMiddleware(config);
  const req = { headers: { host } } as never;
  mw.use(req, {} as never, () => {});
  return (req as { tenant: { slug: string | null } }).tenant;
}

describe('TenantContextMiddleware', () => {
  it('extracts the salon slug from a subdomain', () => {
    expect(run('aurora.coifyn.app').slug).toBe('aurora');
  });

  it('ignores a port on the host', () => {
    expect(run('aurora.coifyn.app:4000').slug).toBe('aurora');
  });

  it('returns null for the bare base host', () => {
    expect(run('coifyn.app').slug).toBeNull();
  });

  it('returns null for www and api', () => {
    expect(run('www.coifyn.app').slug).toBeNull();
    expect(run('api.coifyn.app').slug).toBeNull();
  });

  it('returns null for a deep or foreign host', () => {
    expect(run('a.b.coifyn.app').slug).toBeNull();
    expect(run('example.com').slug).toBeNull();
  });

  it('returns null for localhost', () => {
    expect(run('localhost', 'localhost').slug).toBeNull();
  });
});
