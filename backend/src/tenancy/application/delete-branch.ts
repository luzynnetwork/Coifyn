import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../data/branches.repo.js';
import { ChairsRepo } from '../data/chairs.repo.js';

@Injectable()
export class DeleteBranch {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly chairs: ChairsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, branchId: string): Promise<void> {
    const salonId = await this.salon.execute(user);
    await this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'branch:delete', { salonId });

      const branch = await this.branches.findById(salonId, branchId);
      if (!branch) throw new NotFoundException('Branch not found.');

      const remaining = await this.branches.countActive(salonId);
      if (remaining <= 1) {
        throw new ConflictException(
          'A salon must keep at least one branch.',
        );
      }
      const chairs = await this.chairs.listForBranch(salonId, branchId);
      if (chairs.length > 0) {
        throw new ConflictException(
          'Retire this branch’s chairs before deleting it.',
        );
      }

      await this.branches.softDelete(salonId, branchId);
      await this.events.emit({
        aggregateType: 'branch',
        aggregateId: branchId,
        type: 'BranchDeleted',
        salonId,
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'branch.deleted',
        targetType: 'branch',
        targetId: branchId,
        before: { name: branch.name },
      });
    });
  }
}
