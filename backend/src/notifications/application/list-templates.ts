import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { NOTIFICATION_CATALOG } from '../catalog/notification-catalog.js';
import { NotificationTemplatesRepo } from '../data/notification-templates.repo.js';

/** The built-in catalog plus the salon's versioned overrides. */
@Injectable()
export class ListTemplates {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly templates: NotificationTemplatesRepo,
  ) {}

  execute(user: AuthUser) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'notification:manage', { salonId });
      return {
        catalog: Object.entries(NOTIFICATION_CATALOG).map(([key, entry]) => ({
          key,
          ...entry,
        })),
        overrides: await this.templates.list(salonId),
      };
    });
  }
}
