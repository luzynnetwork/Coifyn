import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { TimeOffRepo, type TimeOffStatus } from '../data/time-off.repo.js';

@Injectable()
export class ListTimeOff {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly timeOff: TimeOffRepo,
  ) {}

  execute(user: AuthUser, branchId?: string, status?: TimeOffStatus) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'roster:view', { salonId, branchId });
      return this.timeOff.list(salonId, branchId, status);
    });
  }
}
