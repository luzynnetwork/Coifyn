import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AppConfigService } from '../../config/config.service.js';

export interface TenantContext {
  /** The salon slug parsed from a `<slug>.<base-host>` request, if any. */
  slug: string | null;
}

/**
 * Parses the salon slug from the request host (`aurora.coifyn.app` → `aurora`)
 * and stashes it on `req.tenant`. It does NOT resolve a salon id or enforce
 * anything yet — the `client` console resolves its salon from the caller's
 * membership (rbac/resolve-current-salon). Slug → salon-id resolution and
 * enforcement land when the `customer` and `marketNetwork` apps, which are
 * reached by subdomain, need them.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly config: AppConfigService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const host = (req.headers.host ?? '').split(':')[0].toLowerCase();
    const base = this.config.get('TENANT_BASE_HOST').toLowerCase();

    let slug: string | null = null;
    if (host && host !== base && host.endsWith(`.${base}`)) {
      const label = host.slice(0, -(base.length + 1));
      if (label && !label.includes('.') && label !== 'www' && label !== 'api') {
        slug = label;
      }
    }

    (req as Request & { tenant?: TenantContext }).tenant = { slug };
    next();
  }
}
