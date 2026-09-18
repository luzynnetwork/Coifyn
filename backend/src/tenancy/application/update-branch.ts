import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../data/branches.repo.js';
import type { SetBranchHoursDto, UpdateBranchDto } from '../dto/branch.dto.js';

@Injectable()
export class UpdateBranch {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, branchId: string, dto: UpdateBranchDto) {
    return this.mutate(user, branchId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
  }

  async setHours(user: AuthUser, branchId: string, dto: SetBranchHoursDto) {
    return this.mutate(user, branchId, { hours: dto.hours });
  }

  private async mutate(
    user: AuthUser,
    branchId: string,
    patch: Record<string, unknown>,
  ) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const before = await this.branches.findById(salonId, branchId);
      if (!before) throw new NotFoundException('Branch not found.');

      // branch:update is scopable — a Manager may only edit their own branches.
      await this.authorize.check(user, 'branch:update', { salonId, branchId });

      const updated = await this.branches.update(salonId, branchId, patch);
      await this.events.emit({
        aggregateType: 'branch',
        aggregateId: branchId,
        type: 'BranchUpdated',
        salonId,
        payload: { changed: Object.keys(patch) },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'branch.updated',
        targetType: 'branch',
        targetId: branchId,
        before: { name: before.name, isActive: before.isActive },
        after: patch,
      });
      return updated ?? before;
    });
  }
}
