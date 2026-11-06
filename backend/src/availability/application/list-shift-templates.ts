import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { ShiftTemplatesRepo } from '../data/shift-templates.repo.js';

@Injectable()
export class ListShiftTemplates {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly templates: ShiftTemplatesRepo,
  ) {}

  execute(user: AuthUser) {
    return this.scope.run(user, async (salonId) => {
      await this.authorize.check(user, 'roster:view', { salonId });
      return this.templates.listForSalon(salonId);
    });
  }
}
