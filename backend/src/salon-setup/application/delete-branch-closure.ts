import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchClosuresRepo } from '../data/branch-closures.repo.js';

@Injectable()
export class DeleteBranchClosure {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly closures: BranchClosuresRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, id: string) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      const closure = await this.closures.findById(salonId, id);
      if (!closure) throw new NotFoundException('Closure not found.');

      await this.authorize.check(user, 'branch:update', {
        salonId,
        branchId: closure.branchId,
      });

      await this.closures.softDelete(salonId, id);

      await this.events.emit({
        aggregateType: 'branch',
        aggregateId: closure.branchId,
        type: 'BranchClosureDeleted',
        salonId,
        payload: { branchId: closure.branchId },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'branch_closure.deleted',
        targetType: 'branch_closure',
        targetId: id,
        before: { startsOn: closure.startsOn, endsOn: closure.endsOn },
      });
    });
  }
}
