import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { TenantScope } from '../../rbac/application/tenant-scope.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { QueueBoardBuilder } from './queue-board-builder.js';

@Injectable()
export class GetQueueBoard {
  constructor(
    private readonly scope: TenantScope,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly builder: QueueBoardBuilder,
  ) {}

  execute(user: AuthUser, branchId: string) {
    return this.scope.run(user, async (salonId) => {
      if (!(await this.branches.findById(salonId, branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'queue:view', { salonId, branchId });
      return this.builder.build(salonId, branchId);
    });
  }
}
