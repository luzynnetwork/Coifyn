import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';
import { AuditWriter } from '../../audit/audit-writer.js';
import { EventBus } from '../../events/event-bus.js';
import { DatabaseService } from '../../persistence/database.service.js';
import { BranchMembershipsRepo } from '../../rbac/data/branch-memberships.repo.js';
import { Authorize } from '../../rbac/application/authorize.js';
import { ResolveCurrentSalon } from '../../rbac/application/resolve-current-salon.js';
import { BranchesRepo } from '../data/branches.repo.js';
import type { CreateBranchDto } from '../dto/branch.dto.js';

@Injectable()
export class CreateBranch {
  constructor(
    private readonly database: DatabaseService,
    private readonly salon: ResolveCurrentSalon,
    private readonly authorize: Authorize,
    private readonly branches: BranchesRepo,
    private readonly branchMemberships: BranchMembershipsRepo,
    private readonly events: EventBus,
    private readonly audit: AuditWriter,
  ) {}

  async execute(user: AuthUser, dto: CreateBranchDto) {
    const salonId = await this.salon.execute(user);
    return this.database.withTenant(user.id, salonId, async () => {
      await this.authorize.check(user, 'branch:create', { salonId });

      const branch = await this.branches.create({
        salonId,
        name: dto.name,
        address: dto.address ?? {},
      });
      // The creator joins the new branch so their branch-scoped grants apply there.
      await this.branchMemberships.add({
        salonId,
        userId: user.id,
        branchId: branch.id,
      });

      await this.events.emit({
        aggregateType: 'branch',
        aggregateId: branch.id,
        type: 'BranchCreated',
        salonId,
        payload: { name: branch.name },
      });
      await this.audit.write({
        salonId,
        actor: user,
        action: 'branch.created',
        targetType: 'branch',
        targetId: branch.id,
        after: { name: branch.name },
      });

      return branch;
    });
  }
}
