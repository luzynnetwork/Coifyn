import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { QueueEntriesRepo } from '../data/queue-entries.repo.js';

@Injectable()
export class ListQueue {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly entries: QueueEntriesRepo,
  ) {}

  async execute(user: AuthUser, branchId: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      if (!(await this.branches.findById(salonId, branchId))) {
        throw new NotFoundException('Branch not found.');
      }
      await this.authorize.check(user, 'queue:view', { salonId, branchId });

      const rows = await this.entries.listActive(salonId, branchId);
      let position = 0;
      return rows.map((r) => ({
        ...r,
        position: r.status === 'waiting' ? ++position : null,
      }));
    });
  }
}
