import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { BranchHoursRepo } from '../data/branch-hours.repo.js';

@Injectable()
export class GetBranchHours {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly branchHours: BranchHoursRepo,
  ) {}

  async execute(user: AuthUser, branchId: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const branch = await this.branches.findById(salonId, branchId);
      if (!branch) throw new NotFoundException('Branch not found.');

      if (!(await this.authorize.roleNameFor(user, salonId))) {
        throw new ForbiddenException('Not a member of this salon.');
      }
      return this.branchHours.listForBranch(salonId, branchId);
    });
  }
}
