import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { NotificationDeliveriesRepo } from '../data/notification-deliveries.repo.js';

@Injectable()
export class ListDeliveries {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly deliveries: NotificationDeliveriesRepo,
  ) {}

  execute(user: AuthUser, from?: string, to?: string) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'notification:manage', { salonId });
      return this.deliveries.list(
        salonId,
        from ? new Date(from) : undefined,
        to ? new Date(to) : undefined,
      );
    });
  }
}
