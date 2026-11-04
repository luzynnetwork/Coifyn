import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { RegisterSessionsRepo } from '../data/register-sessions.repo.js';

/** The branch's open register, or null when none is open. */
@Injectable()
export class GetCurrentRegisterSession {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly sessions: RegisterSessionsRepo,
  ) {}

  async execute(user: AuthUser, branchId: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (!(await this.branches.findById(salonId, branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'pos:operate', { salonId, branchId });
      return (await this.sessions.findOpen(salonId, branchId)) ?? null;
    });
  }
}
