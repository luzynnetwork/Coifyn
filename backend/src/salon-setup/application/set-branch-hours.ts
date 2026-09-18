import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../../tenancy/data/branches.repo.js';
import { BranchHoursRepo } from '../data/branch-hours.repo.js';
import type { SetBranchHoursDto } from '../dto/branch-hours.dto.js';

@Injectable()
export class SetBranchHours {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly branchHours: BranchHoursRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {
  }

  async execute(user: AuthUser, branchId: string, dto: SetBranchHoursDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const branch = await this.branches.findById(salonId, branchId);
      if (!branch) throw new NotFoundException('Branch not found.');

      await this.authorize.check(user, 'branch:update', { salonId, branchId });

      const rows = await this.branchHours.replaceWeek(
        salonId,
        branchId,
        dto.week.map((day) => ({
          weekday: day.weekday,
          isClosed: day.isClosed,
          opensAt: day.isClosed ? null : (day.opensAt ?? null),
          closesAt: day.isClosed ? null : (day.closesAt ?? null),
          breaks: day.isClosed ? [] : day.breaks,
        })),
      );

      await this.events.emit({
        aggregateType: 'branch',
        aggregateId: branchId,
        type: 'BranchHoursUpdated',
        salonId,
        payload: { branchId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'branch.hours_updated',
        targetType: 'branch',
        targetId: branchId,
        after: { week: dto.week },
      });

      return rows;
    });
  }
}
